import React, { SetStateAction } from 'react'
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  vis: boolean,
  name: string,
  setName: React.Dispatch<SetStateAction<string>>,
  setVis: React.Dispatch<SetStateAction<boolean>>
}

const NamePrompt = ({vis, name, setName, setVis}: Props) => {

  const submitName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (name == "") {
      return
    }
    setVis(false)
  }

  return (
    <AnimatePresence>
    <motion.div className={vis ? ' transition-all flex flex-col justify-center items-center h-screen w-screen absolute backdrop-blur-xl' : "transition-all hidden flex flex-col justify-center items-center h-screen w-screen absolute backdrop-blur-xl"}
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity:0}}>
          <motion.div className='w-4/5 h-3/5 lg:w-2/5 lg:h-2/5 bg-fuchsia-300 flex flex-col justify-center items-center rounded-xl shadow-md'
          initial={{y:-500}}
          animate={{y:0}}
          exit={{y:-500}}>
        <form className='flex gap-4 flex-col items-center' onSubmit={(e) => submitName(e)}>
          <p className='text-lg lg:text-2xl'>Hi there! What's your name?</p>
            <input type="text" className='px-5 py-2 rounded-xl required' value={name} onInput={(e:React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}/>
            <button type="submit" className='bg-blue-500 px-5 py-2 rounded-xl active:translate-y-0.5 active:translate-x-0.5 hover:bg-blue-300 transition-all'>Submit</button>
        </form>
        </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}

export default NamePrompt