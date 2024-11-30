import { useEffect, useRef } from "react";

export const useMount = (fn: () => void) => {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current();
    fnRef.current = () => { };
  }, [])
}