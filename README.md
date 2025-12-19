# Nier-themed Midi Visualizer
Midi visualizer with a Nier-themed aesthetic, created with p5js. Aside from the Nier theme, customization of background and note colours is also possible. The visualizer takes in a Type 0 MIDI file and draws out notes on the canvas. Visualizer output can be captured and saved into a .webm file, and is done so using CCapture.js. The information here is also displayed on the visualizer page itself: [https://futsuun.github.io/p5-nier-themed-midi-visualizer/](https://futsuun.github.io/p5-nier-themed-midi-visualizer/)

# MIDI File requirements
- MIDI file MUST be a Type 0 Midi File (all tracks merged into a single MIDI track)
- Ensure MIDI file is exported with time signature AND tempo embedded (if no tempo is detected, there will be a pop-up asking for BPM input)
- Tempo changes are okay, but do note that EXCESSIVE tempo changes will cause the visualizer FPS to drop drastically
- Visualizer is unable to handle changes in time signature during the track (it will only take the first time signature it sees and ignore the rest); it may still work to some degree but try at your own risk!

# Output Format
Output: .webm format, 1920 x 1080, 60 fps

# Using the Visualizer
- Click on "Choose File" to upload a MIDI file (see MIDI File Requirements)
- Click on "Click to Preview" to preview, or enter the number of desired frames and click "Start Capture" to capture visualizer output
- Only the visualizer output will be captured, so you will have to sync the output (.webm file) with your audio track in a video editor
- For Mac users, please use Chrome/Edge/Firefox browsers as Safari does not work properly with this
- It is recommended to include one or more bars of empty space at the beginning of the MIDI track to avoid any abrupt starts
- It is recommended to include an extra 3-4 seconds of capture after the track ends for some buffer
- Frames in track are calculated by (song length) x (FPS)
- There is no back button after starting the preview, so please refresh the page to go back to the main section again for capturing
- Ensure that the visualizer window is the ACTIVE WINDOW during capturing, or capture MAY GET PAUSED
- If you have another way of capturing the visualizer output on your own, eg. screen capture, please feel free!

# Credits
  - Created using p5.js
  - Canvas captured using [CCapture.js](https://github.com/spite/ccapture.js/)
  - Midi parsed using [MidiParser.js](https://www.npmjs.com/package/midi-parser-js)
  - Fonts used (Inconsolata, FOT-Rodin Pro L, Helvetica)
  - [YoRHa CSS page](https://metakirby5.github.io/yorha/) by metakirby5 (for referencing the style)
  - Special thanks to jteosw for reviewing my horrible code
  - Huge thanks to [potatoteto](https://x.com/potatoteto) (the best potato) for helping me catch and fix some bugs, and also [Spiralflip](https://x.com/spiralflip) and jfoe (a.k.a Jeff) for testing and catching some exceptions
 
# Comments
I am not a coder or developer by trade, but I originally made this because I wanted a visualizer; hopefully this might be useful for someone else out there too...
I may not continue work on this (as it was kind of a one-time thing for me), but for any feedback, general comments, or anything else related, you can drop me an email at futsuup@gmail.com

Some of my other links:

[Twitter](https://x.com/futsuunohito2)

[Carrd Site](https://futsuunohito.crd.co/)
