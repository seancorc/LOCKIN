import { TpaServer, TpaSession } from '@augmentos/sdk';
import * as fs from 'fs';
import * as path from 'path';

class LOCKIN extends TpaServer {
  private imageBase64: string;
  private emptyImageBase64: string;
  private clearBitmapTimer: NodeJS.Timeout | null = null;

  constructor(config: any) {
    super(config);

    // Read and encode the bitmap image in constructor
    try {
      const imagePath = path.join(__dirname, 'assets', 'test.bmp');
      const imageBuffer = fs.readFileSync(imagePath);
      this.imageBase64 = imageBuffer.toString('base64');
      console.log('Bitmap image encoded successfully');
      
      // Also load the empty bitmap for clearing
      const emptyImagePath = path.join(__dirname, 'assets', 'empty.bmp');
      const emptyImageBuffer = fs.readFileSync(emptyImagePath);
      this.emptyImageBase64 = emptyImageBuffer.toString('base64');
      console.log('Empty bitmap encoded successfully');
    } catch (error) {
      console.error('Error reading or encoding bitmap images:', error);
      this.imageBase64 = '';
      this.emptyImageBase64 = '';
    }
  }

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
    // Show welcome message
    session.layouts.showTextWall("Example Captions App Ready!");

    // Handle real-time transcription
    const cleanup = [
      session.events.onTranscription((data) => {
        // Show bitmap as soon as any transcription happens
        if (this.imageBase64) {
          console.log("Displaying bitmap image");
          session.layouts.showBitmapView(this.imageBase64);
          
          // Clear any existing timer
          if (this.clearBitmapTimer) {
            console.log("Canceling previous timer");
            clearTimeout(this.clearBitmapTimer);
            this.clearBitmapTimer = null;
          }
        }
        
        // Only set the timer when we get a final transcription
        if (data.isFinal) {
          console.log("Final transcription: " + data.text);
          console.log("Setting timer for 10 seconds");
          
          // Set a new timer for 10 seconds
          this.clearBitmapTimer = setTimeout(() => {
            console.log("Clearing bitmap after 10s of inactivity");
            
            // Use empty bitmap to clear the display instead of showTextWall
            if (this.emptyImageBase64) {
              console.log("Sending empty bitmap to clear display");
              session.layouts.showBitmapView(this.emptyImageBase64);
            } else {
              // Fallback to text wall if empty bitmap couldn't be loaded
              session.layouts.showTextWall("", { durationMs: 100 });
            }
            
            this.clearBitmapTimer = null;
          }, 10000);
        }
      }),

      session.events.onPhoneNotifications((data) => {}),

      session.events.onGlassesBattery((data) => {}),

      session.events.onError((error) => {
        console.error('Error:', error);
      })
    ];

    // Add cleanup handlers
    cleanup.forEach(handler => this.addCleanupHandler(handler));
  }
}

// Start the server
// DEV CONSOLE URL: https://augmentos.dev/
// Get your webhook URL from ngrok (or whatever public URL you have)
const app = new LOCKIN({
  packageName: 'org.kese.lockin', // make sure this matches your app in dev console
  apiKey: 'your_api_key', // Not used right now, play nice
  port: 3000, // The port you're hosting the server on
  augmentOSWebsocketUrl: 'wss://dev.augmentos.org/tpa-ws' //AugmentOS url
});

app.start().catch(console.error);