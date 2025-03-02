import { TpaServer, TpaSession } from '@augmentos/sdk';
import * as fs from 'fs';
import * as path from 'path';

class LOCKIN extends TpaServer {
  private imageBase64: string;
  private emptyImageBase64: string;
  private clearBitmapTimer: NodeJS.Timeout | null = null;
  private isBitmapDisplayed: boolean = false;
  private isLockInModeEnabled: boolean = false;

  constructor(config: any) {
    super(config);

    // Read and encode the bitmap image in constructor
    try {
      const imagePath = path.join(__dirname, 'assets', 'test.bmp');
      console.log(`Attempting to load bitmap from: ${imagePath}`);
      
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`Successfully read bitmap file, size: ${imageBuffer.length} bytes`);
      
      this.imageBase64 = imageBuffer.toString('base64');
      console.log(`Bitmap image encoded successfully, base64 length: ${this.imageBase64.length}`);
      
      // Also load the empty bitmap for clearing
      const emptyImagePath = path.join(__dirname, 'assets', 'empty.bmp');
      console.log(`Attempting to load empty bitmap from: ${emptyImagePath}`);
      
      const emptyImageBuffer = fs.readFileSync(emptyImagePath);
      console.log(`Successfully read empty bitmap file, size: ${emptyImageBuffer.length} bytes`);
      
      this.emptyImageBase64 = emptyImageBuffer.toString('base64');
      console.log(`Empty bitmap encoded successfully, base64 length: ${this.emptyImageBase64.length}`);
    } catch (error) {
      console.error('Error reading or encoding bitmap images:', error);
      this.imageBase64 = '';
      this.emptyImageBase64 = '';
    }
  }

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
    // Reset bitmap display state at the start of each session
    this.isBitmapDisplayed = false;
    this.isLockInModeEnabled = false;
    console.log("Initial state: Lock in mode disabled, bitmap display reset");

    // Handle real-time transcription
    const cleanup = [
      session.events.onTranscription((data) => {
        // Add debug logging for transcription events
        console.log(`Transcription received: "${data.text}", isFinal: ${data.isFinal}, isBitmapDisplayed: ${this.isBitmapDisplayed}, isLockInModeEnabled: ${this.isLockInModeEnabled}`);
        
        // Check for voice commands
        if (data.isFinal) {
          const text = data.text.toLowerCase();
          console.log(`Checking final transcription for commands: "${text}"`);
          
          // Command to turn on lock in mode - more flexible pattern
          const turnOnPattern = /turn\s+on\s+lock\s*in( mode)?\.?/i;
          const isTurnOnCommand = turnOnPattern.test(text);
          console.log(`Turn ON command match: ${isTurnOnCommand}`);
          
          if (isTurnOnCommand) {
            console.log("Command recognized: Turning ON lock in mode");
            this.isLockInModeEnabled = true;
            console.log(`Lock in mode enabled: ${this.isLockInModeEnabled}`);
            
            
            return; // Skip the rest of the processing
          }
          
          // Command to turn off lock in mode - more flexible pattern
          const turnOffPattern = /turn\s+off\s+lock\s*in( mode)?\.?/i;
          const isTurnOffCommand = turnOffPattern.test(text);
          console.log(`Turn OFF command match: ${isTurnOffCommand}`);
          
          if (isTurnOffCommand) {
            console.log("Command recognized: Turning OFF lock in mode");
            
            // First clear the display with empty bitmap
            if (this.emptyImageBase64) {
              console.log("Sending empty bitmap to clear display");
              session.layouts.showBitmapView(this.emptyImageBase64);
            }
            
            this.isLockInModeEnabled = false;
            this.isBitmapDisplayed = false;
            
            // Clear any existing timer
            if (this.clearBitmapTimer) {
              clearTimeout(this.clearBitmapTimer);
              this.clearBitmapTimer = null;
            }
            
            // Show confirmation
            session.layouts.showTextWall("Lock in mode deactivated");
            
            return; // Skip the rest of the processing
          }
        }
        
        // Only process normal transcriptions if lock in mode is enabled
        if (!this.isLockInModeEnabled) {
          return; // Don't do anything if lock in mode is disabled
        }
        
        // When in lock in mode, show bitmap on any speech
        if (this.imageBase64 && !this.isBitmapDisplayed && this.isLockInModeEnabled) {
          console.log("Displaying bitmap image during speech");
          session.layouts.showBitmapView(this.imageBase64);
          this.isBitmapDisplayed = true;``
        }
        
        // Clear any existing timer
        if (this.clearBitmapTimer) {
          console.log("Canceling previous timer");
          clearTimeout(this.clearBitmapTimer);
          this.clearBitmapTimer = null;
        }
        
        // Only set the timer when we get a final transcription and lock in mode is enabled
        if (data.isFinal && this.isLockInModeEnabled) {
          console.log("Final transcription in lock in mode: " + data.text);
          console.log("Setting inactivity timer for 10 seconds");
          
          // Set a new timer for 10 seconds
          this.clearBitmapTimer = setTimeout(() => {
            console.log("Clearing bitmap after 10s of inactivity");
            
            // Use empty bitmap to clear the display
            if (this.emptyImageBase64) {
              console.log("Sending empty bitmap to clear display");
              session.layouts.showBitmapView(this.emptyImageBase64);
              this.isBitmapDisplayed = false; // Reset flag when bitmap is cleared
            } else {
              throw new Error("Empty bitmap not found");
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
  port: 3001, // The port you're hosting the server on
  augmentOSWebsocketUrl: 'wss://staging.augmentos.org/tpa-ws' //AugmentOS url
});

app.start().catch(console.error);