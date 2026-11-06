/* Kit: Point at the sky. Opens the real view; on a computer (no motion sensors), drag to look around. */
import { useMemo, useState } from 'react';
import { dayTimes, partsIn, withDefaults } from '@salat/shared/schedule';
import PointView from '../features/sky/PointView.jsx';
import { Button } from '../ui/index.jsx';

export default function PointKit() {
  const s = useMemo(() => withDefaults({}), []); // Brooklyn: the app's default place
  const today = useMemo(() => { const p = partsIn(new Date(), s.loc.zone); return dayTimes(s, p.y, p.m, p.d); }, [s]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="tinted" icon="target" hug onClick={() => setOpen(true)}>Point at the Sky</Button>
      <PointView open={open} onClose={() => setOpen(false)} s={s} today={today} />
    </>
  );
}
