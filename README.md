# RPT App

A mobile application for rehabilitation physical therapy, connecting patients with their therapists for better exercise tracking and progress monitoring.

## Features

- **Authentication**: Secure login and registration for both patients and therapists
- **Exercise Management**: Create, assign, and track exercises
- **Progress Tracking**: Monitor patient progress with streaks and completion rates
- **Clinic Management**: Therapists can manage their clinic information and patients
- **Real-time Updates**: Stay updated with patient progress and exercise completion

## Tech Stack

- React Native with Expo
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- Expo Router for navigation
- React Native components and animations

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account
- iOS Simulator (Mac only) or Android Emulator

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rpt-app.git
   cd rpt-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a Firebase project and enable:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Storage

4. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

5. Fill in your Firebase configuration in the `.env` file:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

6. Start the development server:
   ```bash
    npx expo start
   ```

7. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
rpt-app/
├── app/                    # Main application code
│   ├── auth/              # Authentication screens
│   ├── components/        # Reusable components
│   ├── context/          # React Context providers
│   ├── types/            # TypeScript type definitions
│   └── firebase.ts       # Firebase configuration
├── assets/               # Static assets
├── .env.example         # Environment variables template
├── app.config.ts        # Expo configuration
├── App.tsx             # Application entry point
└── package.json        # Project dependencies
```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. Push your changes and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@rptapp.com or join our Slack channel.
