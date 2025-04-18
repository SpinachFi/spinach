"use client";

import { useSpiStore } from "@/store";
import Script from "next/script";
import { useState } from "react";
import { Button } from "./ui/button";

export default function Tally({
  formId,
  onClose,
}: {
  formId: string;
  onClose?: () => void;
}) {
  const { setTallyFormId } = useSpiStore();

  const closeForm = () => setTallyFormId(undefined);

  const [isReady, setIsReady] = useState<boolean>(false);

  return (
    <>
      {!isReady && "Loading..."}
      <iframe
        data-tally-src={`https://tally.so/embed/${formId}?alignLeft=1&transparentBackground=1&dynamicHeight=1`}
        width="100%"
        height="284"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Contact form"
      ></iframe>
      <Script
        id="tally-js"
        src="https://tally.so/widgets/embed.js"
        onReady={() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).Tally?.loadEmbeds();
          setIsReady(true);
        }}
      />
      <Button
        className="mt-3 text-spi-dark-green w-[120px] cursor-pointer"
        variant={"outline"}
        onClick={() => (onClose ? onClose() : closeForm())}
      >
        Close form
      </Button>
    </>
  );
}
