export default function Layout(props: ChildrenProps) {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-poppins)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-4xl ">
        {props.children}
      </main>
    </div>
  );
}
