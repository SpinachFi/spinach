"use client";

import { useSpiStore } from "@/store";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export default function Tally({ onClose }: { onClose?: () => void }) {
  const { tallyFormId, setTallyFormId } = useSpiStore();
  const prevTallyFormId = useRef<string | undefined>(tallyFormId);
  const [isReady, setIsReady] = useState<boolean>(false);

  const loadScript = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Tally?.loadEmbeds();
  };

  useEffect(() => {
    if (tallyFormId && prevTallyFormId.current) {
      loadScript();
    }
  }, [tallyFormId]);

  if (!tallyFormId) {
    return null;
  }

  const closeForm = () => setTallyFormId(undefined);

  return (
    <>
      {!isReady && "Loading..."}
      <iframe
        data-tally-src={`https://tally.so/embed/${tallyFormId}?alignLeft=1&transparentBackground=1&dynamicHeight=1`}
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
          loadScript();
          setIsReady(true);
        }}
      />
      {isReady && (
        <Button
          className="mt-3 text-spi-dark-green w-[120px] cursor-pointer"
          variant={"outline"}
          onClick={() => {
            closeForm();
            if (onClose) {
              onClose();
            }
          }}
        >
          Go back
        </Button>
      )}
    </>
  );
}
