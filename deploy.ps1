$env:TURSO_DATABASE_URL = "https://app-this1team.aws-eu-west-1.turso.io"
$env:TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjczNjQ0MzksImlkIjoiMmE3OTM0OWMtZTQ1Zi00ZjdiLTkxNTYtZjBjZGU5NDZjOTg3IiwicmlkIjoiMWZmODc0MjktMjVmOC00ZmQyLTk3MzctNjFkMjA5YzM3MDlhIn0.NslMICq8U0mRvw8cl8NRlRg_EJanJiZa8d8AxTAFgqvRtLjt4qCob93-i5nUOna0NS1Pr9cs8t2p8kX57LmpAA"
$env:GEMINI_API_KEY = "AIzaSyA8jCu32Ei9yHo-2vtH8AwDOsDexRUHCIE"

.\node_modules\.bin\vercel deploy --prod --force --yes --env TURSO_DATABASE_URL=$env:TURSO_DATABASE_URL --env TURSO_AUTH_TOKEN=$env:TURSO_AUTH_TOKEN --env GEMINI_API_KEY=$env:GEMINI_API_KEY
