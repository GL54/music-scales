import { motion, AnimatePresence } from 'framer-motion';

type CardProps = {
    heading: string,
    relativeRoot: string,
    scale: string,
    relativeScale: string[],
    message?: string,
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
    message,
    textColor = "text-white",
    bgColor = "bg-[#08191f]",
    pHeading = "text-[#D31C8C]"
    ,pBg = "bg-[#D31C8C]"
}: CardProps) => {

    // We use the joined scale as a key so the animation triggers on every note change
    const scaleKey = relativeScale.join("");
// console.log(`root ${relativeRoot} and scale isss ${relativeScale}`)
    return (
        <div className={`p-5 ${textColor} ${bgColor} duration-200 transition-all  rounded-xl shadow-lg overflow-hidden`}>
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

                    {message ? (
                        <p className="text-xs mt-2 text-indigo-300 italic">
                            {message}
                        </p>
                    ) : null}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default Card