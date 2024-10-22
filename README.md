# SIGNAL-23 Website

## How to Run

1. Install Docker:
   - Mac: Download and install [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)

2. Open a terminal/command prompt in this folder

3. Run the command:
   ```
   docker compose up --build
   ```

4. Open your web browser and go to: http://localhost:8080

5. To stop the website, press CTRL+C in the terminal, or run:
   ```
   docker compose down
   ```

## Troubleshooting

If you see "port already in use" error:
1. Make sure you don't have another website running on port 8080
2. Run `docker compose down` and try again

For other issues, contact [your contact info]