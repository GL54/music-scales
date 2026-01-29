import { motion, AnimatePresence } from 'framer-motion';

type CardProps = {
    heading: string,
    relativeRoot: string,
    scale: string,
    relativeScale: string[],
    rootNote?: string,
    textColor?: string,
    bgColor?: string,
    pHeading?: string,
    pBg?: string
}

const Card = ({
    heading,
    relativeRoot,
    scale,
    relativeScale,
    rootNote,
    textColor = "text-white",
    bgColor = "bg-[#08191f]",
    pHeading = "text-[#91039b]"
    ,pBg = "bg-[#91039b]"
}: CardProps) => {

    // We use the joined scale as a key so the animation triggers on every note change
    const scaleKey = relativeScale.join("");

    return (
        <div className={`p-5 ${textColor} ${bgColor} duration-200 transition-all rounded-xl shadow-lg overflow-hidden`}>
             <AnimatePresence mode="wait">
                <motion.div
                    key={scaleKey}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
            <h3 className={`${pHeading} font-bold flex items-center gap-2`}>
                <span className={`w-2 h-2 ${pBg} rounded-full animate-pulse`}></span>
                {heading} {relativeRoot} {scale}
            </h3>

            {/* AnimatePresence handles the exit/entry of components */}
           
                    <p className={`text-2xl tracking-[0.2em] font-mono mt-3 ${textColor}`}>
                        {relativeScale.join(" ")}
                    </p>

                    {rootNote ? (
                        <p className="text-xs mt-2 text-indigo-300 italic">
                            Shares the same notes as {rootNote} Major
                        </p>
                    ) : null}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default Card