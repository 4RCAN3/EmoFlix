from flask import Flask, request, jsonify, render_template, send_from_directory
import pandas as pd
import numpy as np
import os
import pickle
import random
import requests
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

app = Flask(__name__, static_url_path='/static')

# Load your trained SentenceTransformer model
MODEL_PATH = 'emotion_embedding_model'
embedding_model = SentenceTransformer(MODEL_PATH)

# Load movie data
DATA_PATH = 'wiki_movie_plots_deduped.csv'
df = pd.read_csv(DATA_PATH)

# Ensure consistent column names
df = df.rename(columns=lambda x: x.strip().lower().replace(" ", "_"))
assert 'plot' in df.columns and 'title' in df.columns, "Missing 'plot' or 'title' column"

# Compute or load embeddings
EMB_PATH = 'embeddings.pkl'
if os.path.exists(EMB_PATH):
    with open(EMB_PATH, 'rb') as f:
        movie_embeddings = pickle.load(f)
else:
    print("Computing embeddings... this may take a while.")
    plots = df['plot'].astype(str).tolist()
    movie_embeddings = embedding_model.encode(plots, batch_size=32, show_progress_bar=True)
    with open(EMB_PATH, 'wb') as f:
        pickle.dump(movie_embeddings, f)

# TMDB API configuration
TMDB_API_KEY = 'b7abc30f2303dc9fcdf35296694d2c60'  # Replace with your actual API key
TMDB_API_URL = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

def get_movie_details(title):
    """Fetch movie details from TMDB API"""
    search_url = f"{TMDB_API_URL}/search/movie"
    params = {
        'api_key': TMDB_API_KEY,
        'query': title
    }
    
    try:
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if data['results'] and len(data['results']) > 0:
            movie = data['results'][0]
            
            # Get additional details
            movie_id = movie['id']
            details_url = f"{TMDB_API_URL}/movie/{movie_id}"
            details_params = {
                'api_key': TMDB_API_KEY,
                'append_to_response': 'credits,videos'
            }
            
            details_response = requests.get(details_url, params=details_params)
            details_data = details_response.json()
            
            return {
                'tmdb_id': movie['id'],
                'title': movie['title'],
                'poster_path': f"{TMDB_IMAGE_BASE_URL}{movie['poster_path']}" if movie['poster_path'] else None,
                'backdrop_path': f"{TMDB_IMAGE_BASE_URL}{movie['backdrop_path']}" if movie.get('backdrop_path') else None,
                'release_date': movie.get('release_date', ''),
                'overview': movie.get('overview', ''),
                'vote_average': movie.get('vote_average', 0),
                'genres': details_data.get('genres', []),
                'runtime': details_data.get('runtime', 0),
                'director': next((person['name'] for person in details_data.get('credits', {}).get('crew', []) 
                                if person.get('job') == 'Director'), None),
                'cast': [person['name'] for person in details_data.get('credits', {}).get('cast', [])[:5]]
            }
        else:
            return None
    except Exception as e:
        print(f"Error fetching movie details: {e}")
        return None

@app.route('/')
def index():
    # Get 20 random movies for the homepage
    random_indices = random.sample(range(len(df)), min(20, len(df)))
    random_movies = []
    count = 0 
    idx = 0
    while count < 20:
        
        if idx >= len(random_indices):
            extra_indices = random.sample(range(len(df)), min(20, len(df)))
            random_indices.extend(extra_indices)

        movie = df.iloc[random_indices[idx]]
        movie_details = get_movie_details(movie['title'])
        print(movie_details)
        
        if movie_details:
            movie_details['plot'] = movie['plot']
            random_movies.append(movie_details)
            count += 1

        idx += 1
    
    # Make sure we have at least some movies to display
    random_movies = random_movies[:12]
    print(random_movies)
    return render_template('index.html', movies=random_movies)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    current = data.get('current_emotion')
    desired = data.get('desired_emotion')
    top_n = int(data.get('top_k', 5))

    if not current or not desired:
        return jsonify({"error": "Missing 'current_emotion' or 'desired_emotion'"}), 400

    # Encode emotional states
    vec_A = embedding_model.encode([current])[0]
    vec_B = embedding_model.encode([desired])[0]
    transition_vec = vec_B - vec_A

    # Compute similarity between transition vector and movie plots
    similarity_scores = cosine_similarity([transition_vec], movie_embeddings)[0]
    top_indices = np.argsort(similarity_scores)[::-1][:top_n*2]  # Get more than needed to filter with TMDB

    recommendations = []
    for i in top_indices:
        movie = df.iloc[i]
        movie_title = movie['title']
        movie_details = get_movie_details(movie_title)
        
        if movie_details:
            movie_details['plot'] = movie['plot']
            movie_details['score'] = float(similarity_scores[i])
            recommendations.append(movie_details)
            
            if len(recommendations) >= top_n:
                break
    
    return jsonify(recommendations)

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    # Ensure the template directory exists
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(host='0.0.0.0', port=5000, debug=True)