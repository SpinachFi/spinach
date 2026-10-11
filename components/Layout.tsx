"use client";

import { Header } from "./Header";

type LayoutProps = {
  onTallyClose?: () => void;
  actionsDisabled?: boolean;
};

export default function Layout(props: ChildrenProps & LayoutProps) {
  const { children, actionsDisabled } = props;

  return (
    <div className="min-h-screen font-[family-name:var(--font-poppins)]">
      <Header actionsDisabled={actionsDisabled} />
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col items-center gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
    </div>
  );
}
