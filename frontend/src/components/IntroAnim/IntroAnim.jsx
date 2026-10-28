import { useState, useEffect } from 'react';
import './IntroAnim.css';

function IntroAnim({ onAnimComplete }) {
  const [status, setStatus] = useState(''); // '', 'fade-text', 'slide-out'

  useEffect(() => {
    // Шаг 1: Ждем пока текст прилетит и посветит (2.4 секунды)
    const textTimer = setTimeout(() => {
      setStatus('fade-text');
    }, 1700);

    // Шаг 2: Через 400мс после затухания текста раздвигаем створки экрана
    const gateTimer = setTimeout(() => {
      setStatus('fade-text slide-out');
    }, 2100);

    const fadeScreenTimer = setTimeout(() => {
      setStatus('fade-text slide-out fade-out-screen');
    }, 2700);

    // Шаг 3: Полностью выгружаем интро из памяти, когда створки улетели за экран (1.2 секунды на анимацию)
    const completeTimer = setTimeout(() => {
      onAnimComplete();
    }, 4000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(gateTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimComplete]);

  return (
    <div className={`intro-overlay ${status}`}>
      {/* Левая створка */}
      <div className="intro-gate gate-left"></div>
      
      {/* Неоновый текст по центру */}
      <div className="intro-text-box">
        <h1 className="intro-neon-logo">chrt-hub</h1>
      </div>
      
      {/* Правая створка */}
      <div className="intro-gate gate-right"></div>
    </div>
  );
}

export default IntroAnim;
