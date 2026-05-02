import { useEffect, useRef, useState } from 'react';
import MediaCard from './MediaCard';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof MediaCard>;

function LazyMediaCard(props: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { rootMargin: '400px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    if (!visible) {
        return <div ref={ref} className="aspect-square rounded-[1rem] bg-base-200/30" />;
    }

    return <MediaCard {...props} />;
}

export default LazyMediaCard;
