# EmoFlix
EmoFlix is a personalized movie recommendation web application that suggests movies based on your current emotion and desired mood.
Built using Next.js, Tailwind CSS, and powered by a Python Flask backend for emotion-based movie recommendations.

## Features

* Recommend movies based on current and desired emotions
* Interactive chat-based UI for smooth user input
* Fast, responsive design with Tailwind CSS
* Connects to a Python backend server for intelligent recommendations
* Mobile-friendly and fully responsive

## Tech Stack

* Frontend: Next.js, React, Tailwind CSS
* Backend: Python Flask
* API Communication: Fetch API (REST)

## Installation and Setup

1. Clone the Repository
```bash
git clone https://github.com/4RCAN3/EmoFlix
cd EmoFlix
```

2. Install Frontend Dependencies

```bash
npm install
# or
yarn install
```

3. Start the Frontend Server
```bash
npm run dev
# or
yarn dev
```
By default, it runs on `http://localhost:3000`.

4. Backend Setup (Flask Server)

* Make sure you have Python 3.x installed
* Install required Python libraries:

```bash
pip install flask flask-cors
```

* Navigate to your backend folder and run:

```bash
python main.py
```

Your backend should now run on `http://localhost:5000`.

## Usage
1. Enter your current emotion (e.g., "sad", "happy").
2. Enter your desired emotion (e.g., "excited", "calm").
3. EmoFlix will recommend a list of movies to help you transition between emotions.

## Folder Structure

```bash
EmoFlix/
├── components/     # React components (e.g., ChatBox)
├── public/         # Static assets (images, icons)
├── styles/         # Global styles
├── app/            # Next.js app directory
├── backend/        # (Optional) Flask server
├── README.md
└── package.json
```

## Contributing
Pull requests are welcome.For major changes, please open an issue first to discuss what you would like to change.

## License
This project is open-source and available under the MIT License.


## Screenshots

1. Home Page  
   ![Home Page](https://raw.githubusercontent.com/KrishnaD098/EmoFlix/features-branch/static/screenshots/homePage.jpg)

2. Search Interface  
   ![Search Interface](https://raw.githubusercontent.com/KrishnaD098/EmoFlix/features-branch/static/screenshots/SearchEngine.jpg)

3. Recommendations  
   ![Recommendations](https://raw.githubusercontent.com/KrishnaD098/EmoFlix/features-branch/static/screenshots/FinalPage.jpg)
