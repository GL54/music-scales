import React, { useState, useMemo, useEffect } from "react";
import Card from "./Card"
type AccidentalType = "all" | "sharps" | "flats";

// 2. Explicitly type the object
const CHROMATIC_SCALE: Record<AccidentalType, string[]> ={ "all":[
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
],
"sharps":[
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
],
"flats":[
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
]};
const ACCIDENTALS  = ["all","flats","sharps"] as const;
const SCALES = {
  major: [2, 2, 1, 2, 2, 2], // W-W-H-W-W-W-H
  minor: [2, 1, 2, 2, 1, 2], // W-H-W-W-H-W-W
  minorp:[3, 2 , 2, 3],//(W+H) - W - W - (W+H)
  majorp:[2 , 2, 3, 2 ] // $W - W - (W+H) - W
}
// const compareNotes = (noteA: string, noteB: string): boolean => {
//   // 1. Split both strings into arrays (e.g., "C#/Db" becomes ["C#", "Db"])
//   const partsA = noteA.split("/");
//   const partsB = noteB.split("/");

//   // 2. Check if any element in partsA exists inside partsB
//   return partsA.some(part => partsB.includes(part));
// };

// const getIndexValue = (array:string[],check:string, def:number): number => {
//   if(array.indexOf(check)){
//     return array.indexOf(check)
//   }else{

//     def 
//   }
// }
const Notes: React.FC = () => {
  const [accidentalType,setAccidentalsType] = useState<AccidentalType>("all")

  const [rootNote, setRootNote] = useState("C");
    const currentNotesArray = CHROMATIC_SCALE[accidentalType];
  const [rootIndex ,setRootIndex] = useState(currentNotesArray.indexOf(rootNote))

  // Safeguard: If rootNote isn't in the new accidental array, reset to 'C'
  useEffect(() => {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRootNote(currentNotesArray[rootIndex])
    // if (compareNotes(rootNote,currentNotesArray[0])) {
    //   // eslint-disable-next-line react-hooks/set-state-in-effect
      
    // }
    
  }, [accidentalType, currentNotesArray, rootIndex]);

    useEffect(() => {

      // if(!currentNotesArray.indexOf(rootNote)){
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRootIndex(currentNotesArray.indexOf(rootNote))
      // }
      console.log("index isssss",rootIndex)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNote]);

  const calculateScale = (root: string, intervals: number[]) => {
    let currentIndex = currentNotesArray.indexOf(root);
    // let currentIndex = getIndexValue(currentNotesArray,root,rootIndex)
    // setRootIndex(currentIndex)
    // setRootNote(currentNotesArray[rootIndex]);
    const scale = [rootNote];

    intervals.forEach((step) => {
      currentIndex = (currentIndex + step) % currentNotesArray.length;
      scale.push(currentNotesArray[currentIndex]);
    });

    return scale;
  };

  const majorScale = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => calculateScale(rootNote, SCALES.major),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootNote,accidentalType],
  );
  const minorScale = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => calculateScale(rootNote, SCALES.minor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootNote,accidentalType],
  );

    const penatonicMajorScale = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => calculateScale(rootNote, SCALES.majorp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootNote,accidentalType],
  );
  const penatonicMinorScale = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => calculateScale(rootNote, SCALES.minorp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootNote,accidentalType],
  );
  const relativeMinorRoot = majorScale[5];
  const relativeMinorScale = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => calculateScale(relativeMinorRoot , SCALES.minor),
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [relativeMinorRoot,accidentalType],
  );


const data = [
  {
    heading: "",
    relativeRoot:rootNote ,
    scale: "Major Scale",
    relativeScale: majorScale,
    // rootNote : ""
    // textColor: "string" ,
    // bgColor: "string"
  },
  {
    heading: "",
    relativeRoot:rootNote ,
    scale: "Minor Scale",
    relativeScale: minorScale,
    // rootNote : ""
    // textColor: "string" ,
    // bgColor: "string"
  },
  {
    heading: "Relative Minor:",
    relativeRoot:relativeMinorRoot ,
    scale: "Major Scale",
    relativeScale: relativeMinorScale,
    rootNote : rootNote,
    textColor: "text-white" ,
    bgColor: "bg-gray-900"
    ,pHeading:"text-[#7cdffc]",
    pBg:"bg-[#7cdffc]"
  }
  ,
    {
    heading: "",
    relativeRoot:rootNote ,
    scale: "Minor Penatonic Scale",
    relativeScale: penatonicMinorScale,
    // rootNote : ""
    // textColor: "string" ,
    // bgColor: "string"
  },
  {
    heading: "",
    relativeRoot:rootNote ,
    scale: "Major Penatonic Scale",
    relativeScale: penatonicMajorScale,
    // rootNote : ""
    // textColor: "string" ,
    // bgColor: "string"
  },
]

  return (
    <div className="p-6 max-w-3xl mx-auto bg-dark rounded-xl shadow-md space-y-4 w-full">
      <h2 className="text-4xl font-bold text-white-800 pb-5">
        Music Scales
      </h2>

<div className="flex flex-wrap md:flex-no-wrap gap-2 pb-2 justify-center pb-5">
          {ACCIDENTALS.map((key) => {
            const isSelected = accidentalType === key;
            return (

              <button
                key={key}
                onClick={() => setAccidentalsType(key)}
                className={`
            w-12 h-12 flex items-center justify-center rounded-lg border-2 duration-200  border-transparent font-bold transition-all  text-[#01131c] hover:bg-[#1E1137] hover:text-[#fa1ea2] hover:shadow-[2px_2px_0px_0px_rgba(250,30,162)]
            ${
              isSelected ?"color-[#1E1137] text-[#fa1ea2] shadow-[2px_2px_0px_0px_rgba(250,30,162)] animate-pulse":"bg-[#7cdffc]"
                // ? "bg-indigo-600 text-white shadow-lg scale-110"
                // : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 hover:bg-indigo-50"
            }
          `}
              >
                {key}
              </button>
    
            );
          })}
        </div>
      <div className="space-y-2">
        {/* <label className="block text-sm pb-3 font-medium text-gray-200">
          Select Root Note: 
         
        </label> */}

        <div className="flex flex-wrap md:flex-no-wrap gap-2 pb-2 justify-center pb-5">
          {currentNotesArray.map((note:string ) => {
            const isSelected = rootNote === note;
            return (

              <button
                key={note}
                onClick={() => setRootNote(note)}
                className={`
            w-12 h-12 flex items-center justify-center rounded-lg border-2 duration-200  border-transparent font-bold transition-all  text-[#01131c] hover:bg-[#1E1137] hover:text-[#fa1ea2] hover:shadow-[2px_2px_0px_0px_rgba(250,30,162)]
            ${
              isSelected ?"color-[#1E1137] text-[#fa1ea2] shadow-[2px_2px_0px_0px_rgba(250,30,162)] animate-pulse":"bg-[#7cdffc]"
                // ? "bg-indigo-600 text-white shadow-lg scale-110"
                // : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 hover:bg-indigo-50"
            }
          `}
              >
                {note}
              </button>
    
            );
          })}
        </div>
      </div>

      <hr className="py-4 border-slate-200 duration-200 transition-colors" />
          <div className="grid gap-4">{
            data.map((scale)=> {
              return <Card {...scale}/>
            })
          }</div>
     
    </div>
  );
};

export default Notes;
