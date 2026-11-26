import {useEffect, useRef, useState} from 'react';

type Props = {
  delay?: number;
  onHidden?: () => void;
  children: React.ReactNode;
};

export function HideAfterDelay(props: Props) {
  const {delay = 3000, onHidden, children} = props;

  const [visible, setVisible] = useState(true);
  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;

  useEffect(() => {
    const timerId = setTimeout(() => {
      setVisible(false);
      onHiddenRef.current?.();
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [delay]);

  return visible ? children : null;
}
