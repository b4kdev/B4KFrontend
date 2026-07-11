interface Props {
  children: React.ReactNode
}

export default function HScrollRow({ children }: Props) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-sp-4 lg:-mx-sp-8 px-sp-4 lg:px-sp-8">
      <div className="flex gap-sp-3 pb-[4px]" style={{ width: 'max-content' }}>
        {children}
      </div>
    </div>
  )
}
