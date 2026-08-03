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
    bgColor = "bg-white/5", // Glass effect base
    pHeading = "text-[#91039b]",
    pBg = "bg-[#91039b]"
}: CardProps) => {

    const scaleKey = relativeScale.join("");

    return (
        <div className={`p-8 ${textColor} ${bgColor} backdrop-blur-xl border border-white/10 duration-200 transition-all rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative`}>
            {/* Subtle glow effect behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={scaleKey}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative z-10 text-center"
                >
                    <h3 className={`${pHeading} font-bold text-2xl mb-4 flex items-center justify-center gap-3 drop-shadow-md`}>
                        <span className={`w-3 h-3 ${pBg} rounded-full shadow-[0_0_10px_currentColor]`}></span>
                        {heading} {relativeRoot} {scale}
                    </h3>
           
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {relativeScale.map((note, i) => (
                            <motion.span 
                                key={i}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
                                className={`text-3xl tracking-widest font-mono font-bold ${textColor} drop-shadow-lg bg-black/20 px-4 py-2 rounded-xl border border-white/5`}
                            >
                                {note}
                            </motion.span>
                        ))}
                    </div>

                    {rootNote && (
                        <p className="text-sm mt-6 text-gray-400 italic">
                            Shares the same notes as {rootNote} Major
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default Card;