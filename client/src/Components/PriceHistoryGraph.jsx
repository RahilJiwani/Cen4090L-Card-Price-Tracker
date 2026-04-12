import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PriceHistoryGraph = ({ priceData, cardName }) => {
  const containerRef = useRef(null);
  const userSelectRef = useRef('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWindow, setDragStartWindow] = useState({ start: 0, end: 0 });

  const chartData = useMemo(
    () =>
      priceData.map((item) => ({
        label: item.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        price: item.price,
      })),
    [priceData]
  );

  const totalPoints = chartData.length;
  const initialVisibleCount = Math.min(12, Math.max(1, totalPoints));
  const [viewWindow, setViewWindow] = useState({
    start: Math.max(0, totalPoints - initialVisibleCount),
    end: Math.max(0, totalPoints - 1),
  });

  const visibleCount = Math.max(1, viewWindow.end - viewWindow.start + 1);
  const visibleData = chartData.slice(viewWindow.start, viewWindow.end + 1);
  const minVisiblePoints = Math.min(6, Math.max(1, totalPoints));

  const clampWindow = (start, count) => {
    const boundedCount = Math.max(1, Math.min(count, totalPoints));
    const maxStart = Math.max(0, totalPoints - boundedCount);
    const boundedStart = Math.max(0, Math.min(start, maxStart));
    return {
      start: boundedStart,
      end: boundedStart + boundedCount - 1,
    };
  };

  const zoomWindow = (wheelDelta) => {
    if (totalPoints <= 1) return;

    const nextCount =
      wheelDelta < 0
        ? Math.max(minVisiblePoints, visibleCount - 1)
        : Math.min(totalPoints, visibleCount + 1);

    const center = viewWindow.start + Math.floor(visibleCount / 2);
    const nextStart = center - Math.floor(nextCount / 2);
    setViewWindow(clampWindow(nextStart, nextCount));
  };

  // Use a native non-passive wheel listener so preventDefault reliably blocks page scroll.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      zoomWindow(event.deltaY);
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoomWindow]);

  const handleMouseDown = (e) => {
    if (totalPoints <= visibleCount) return;
    e.preventDefault();
    e.stopPropagation();

    userSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWindow(viewWindow);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - dragStartX;
    const width = Math.max(1, containerRef.current.clientWidth);
    const shift = Math.round((deltaX / width) * visibleCount);

    if (shift === 0) return;

    const nextStart = dragStartWindow.start - shift;
    setViewWindow(clampWindow(nextStart, visibleCount));
  };

  const stopDragging = () => {
    if (document.body.style.userSelect === 'none') {
      document.body.style.userSelect = userSelectRef.current;
    }
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (document.body.style.userSelect === 'none') {
        document.body.style.userSelect = userSelectRef.current;
      }
    };
  }, []);

  const formatPrice = (value) => `$${Number(value).toLocaleString()}`;

  return (
    <div
      className="price-history-graph-wrapper"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onDragStart={(e) => e.preventDefault()}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <ResponsiveContainer width="100%" height={300}>
          <LineChart data={visibleData} margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3a37" />
            <XAxis dataKey="label" tick={{ fill: '#aaa', fontSize: 12 }} axisLine={{ stroke: '#555' }} tickLine={{ stroke: '#555' }} />
            <YAxis
              tick={{ fill: '#aaa', fontSize: 12 }}
              axisLine={{ stroke: '#555' }}
              tickLine={{ stroke: '#555' }}
              tickFormatter={formatPrice}
            />
            <Tooltip
              formatter={(value) => formatPrice(value)}
              contentStyle={{ backgroundColor: '#f8f8f8', border: '1px solid #ccc', borderRadius: 4 }}
              labelStyle={{ color: '#222' }}
            />
            <Legend wrapperStyle={{ color: '#aaa' }} />
            <Line type="monotone" dataKey="price" name={`${cardName} Price`} stroke="#d7a73f" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      <p className="graph-help-text">Drag to pan • Scroll wheel to zoom • Hover to see prices</p>
    </div>
  );
};

export default PriceHistoryGraph;

