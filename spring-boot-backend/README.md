# College LMS Spring Boot Backend

This is the backend for the College LMS application, built with Spring Boot, JPA, and Firebase Admin SDK.

## Prerequisites

*   **Java 17** or higher.
*   **Maven** installed.
*   **MySQL Server**: Running locally on port 3306.
    *   Username: `root`
    *   Password: `admin`
    *   The database `lms_db` will be created automatically.
*   **Firebase Service Account Key**:
    1.  Go to the [Firebase Console](https://console.firebase.google.com/).
    2.  Select your project.
    3.  Go to **Project Settings** > **Service Accounts**.
    4.  Click **Generate new private key**.
    5.  Rename the downloaded file to `serviceAccountKey.json`.
    6.  Place it in `src/main/resources/`.

## How to Run

1.  Open a terminal in the project root.
2.  Run the following command:
    ```bash
    mvn spring-boot:run
    ```
3.  The server will start at `http://localhost:8080`.
4.  The database `lms_db` will be automatically created in your MySQL instance.

## API Endpoints

*   `GET /api/users/{uid}`: Get user profile.
*   `POST /api/users`: Save/Update user profile.
*   `GET /api/quizzes`: List all quizzes.
*   `POST /api/quizzes`: Create a new quiz.
*   `POST /api/quizzes/{id}/attempts`: Submit a quiz attempt.
*   `GET /api/assignments`: List all assignments.
*   `POST /api/assignments/{id}/submissions`: Submit an assignment.

## Integration with Frontend

To connect your React frontend to this backend, you should replace the direct Firestore calls with `fetch` or `axios` calls to `http://localhost:8080/api/...`.
