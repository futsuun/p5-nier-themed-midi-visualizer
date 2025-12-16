//NOTE: MIDI MUST BE EXPORTED AS A TYPE 0 MIDI FILE (all tracks merged to a single midi track)
//Midi file format specs found here: https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications

function extractTimeSig(timeSigEvent, midiDeltaTime){
  var num = timeSigEvent.data[0];
  var den = 2**timeSigEvent.data[1];
  var time = timeSigEvent.deltaTime + midiDeltaTime;
  var clock = timeSigEvent.data[2];
  var timeArr = [num, den, time, clock];
  
  //print("Time Signature is " + num + "/" + den + "\n");
  //print("Delta Time is " + time);
  return(timeArr);
}

function extractTempo(tempoEvent, midiDeltaTime){
  var tempo = tempoEvent.data;
  var time = tempoEvent.deltaTime + midiDeltaTime;
  var tempoArr = [tempo, time];
  
  return(tempoArr);
}

function extractNoteVal(noteEvent, midiDeltaTime){
  var noteOn;
  if (noteEvent.type === 9){
    noteOn = 1;
    //Note On event is type 9
  }else{
    noteOn = 0;}
  
  var note = noteEvent.data[0];
  var vel = noteEvent.data[1];
  var time = noteEvent.deltaTime + midiDeltaTime;
  var noteArr = [noteOn, note, vel, time];
  
  return(noteArr);
}

function midiExtract(midiArrayRaw){
  var midiStripped = []
  var midiDeltaTime = 0
  var midiTempo = []
  var notes = []
  var timeSig = []
  var n = 0 //counter for the amount of note on/off messages
  var k = 0 //counter for the amount of tempo meta messages
  var m = 0 //counter for amount of time signature meta messages
  var eventTotal = 0

  var midiTrack = midiArrayRaw.track[0];
 
  for(var events in midiTrack.event){  
    
    //check for metaevents (metaevents are type 255)
    if(midiTrack.event[events].type === 255){
      //print(midiTrack.event[events]);
      
      if(midiTrack.event[events].metaType === 88){
        //Time signature events are metaType 88
        //Clocks per click are inside time signature events for js midi parser
        timeSig.push(extractTimeSig(midiTrack.event[events], midiDeltaTime));
        midiDeltaTime = 0;
        
        //written as: time sig numerator, time sig denominator, delta time in ppqn
        midiStripped.push(str("timeSig " + timeSig[m][0]) + " " + timeSig[m][1] + " " + timeSig[m][2]);
        midiStripped.push(str("clock " + timeSig[m][3]));
        m+=1;        
      }
      
      if(midiTrack.event[events].metaType === 81){
        //Set Tempo events are metaType 81
        midiTempo.push(extractTempo(midiTrack.event[events], midiDeltaTime));
        midiDeltaTime = 0;
        
        //written in txt file as: tempo in microsecs, delta time in ppqn
        midiStripped.push(str("tempo " + midiTempo[k][0] + " " + midiTempo[k][1]));
        k+=1;
      }
      
      else{
        midiDeltaTime = midiDeltaTime + midiTrack.event[events].deltaTime;
      }
    }
    else{
      if(midiTrack.event[events].type === 8 || midiTrack.event[events].type === 9){
        //Note off event is type 8, Note on event is type 9
        notes.push(extractNoteVal(midiTrack.event[events], midiDeltaTime));
        midiDeltaTime = 0
        
        //Note values are read from left to right as follows:
        //Note on/off > Note value (in piano roll) > velocity > delta time
        midiStripped.push(str("note " + notes[n][0] + " " + notes[n][1] + " " + notes[n][2] + " " + notes[n][3]));
        n+=1;
      }else{
        midiDeltaTime = midiDeltaTime + midiTrack.event[events].deltaTime;
      }
    }
  }
  //print(midiStripped);
  return(midiStripped);
}

