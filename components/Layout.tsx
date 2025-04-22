"use client";

import { useSpiStore } from "@/store";
import { Header } from "./Header";
import Tally from "./Tally";

type LayoutProps = {
  onTallyClose?: () => void;
  actionsDisabled?: boolean;
};

export default function Layout(props: ChildrenProps & LayoutProps) {
  const { tallyFormId } = useSpiStore();

  const { children, onTallyClose, actionsDisabled } = props;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-poppins)]">
      <main className="flex flex-col gap-8 row-start-2 items-center max-width-[1240px]">
        <Header actionsDisabled={actionsDisabled} />
        {tallyFormId ? <Tally onClose={onTallyClose} /> : children}
      </main>
    </div>
  );
}
