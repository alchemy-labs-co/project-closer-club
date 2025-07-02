import { motion } from 'motion/react'
import { useFormControls } from './use-lead-capture-form'
import type { Step } from '~/lib/types'

const RenderComponent = ({ steps }: { steps: Step[] }) => {
  const { currentPageIndex, delta } = useFormControls()
  const step = steps[currentPageIndex]
  const Comp = step.component
  if (!Comp) return null
  return (
    <motion.div
      key={currentPageIndex}
      initial={{ opacity: 0, y: delta > 0 ? '10%' : '-10%' }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut', type: 'tween' }}
      className="flex min-h-[9rem] md:min-h-[18.75rem] flex-1 flex-col md:justify-center gap-y-4 px-7 relative z-50"
    >
      <div>
        <h2 className="text-3xl md:text-4xl leading-relaxed font-medium tracking-tight text-center text-white relative z-50">{step.title}</h2>
      </div>
      <div className="relative z-50">
        {Comp}
      </div>
    </motion.div>
  )
}

export default RenderComponent
