import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import Svg, { Rect, Polygon, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_DRAGON_SIZE = 64;
const EGG_SIZE = 32;
const GAME_DURATION = 60 * 1000; // 1 minute in milliseconds

const Dragon = ({ size, x }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute', bottom: 0, left: x - size / 2 }}>
    <Rect x={16} y={24} width={32} height={24} fill="#2ecc71" />
    <Rect x={8} y={16} width={16} height={16} fill="#2ecc71" />
    <Rect x={12} y={20} width={4} height={4} fill="#ffffff" />
    <Rect x={14} y={22} width={2} height={2} fill="#000000" />
    <Polygon points="24,16 28,8 32,16 36,8 40,16" fill="#e74c3c" />
    <Rect x={16} y={48} width={8} height={8} fill="#2ecc71" />
    <Rect x={40} y={48} width={8} height={8} fill="#2ecc71" />
    <Polygon points="48,32 56,32 56,40 48,40" fill="#2ecc71" />
    <Path d="M24,24 L8,8 L24,16 Z" fill="#3498db" />
    <Path d="M40,24 L56,8 L40,16 Z" fill="#3498db" />
  </Svg>
);

const Egg = ({ x, y }) => (
  <Svg width={EGG_SIZE} height={EGG_SIZE} viewBox="0 0 64 64" style={{ position: 'absolute', top: y, left: x }}>
    <Rect x={8} y={32} width={16} height={24} fill="#f39c12" />
    <Rect x={12} y={28} width={8} height={4} fill="#f39c12" />
    <Rect x={10} y={56} width={12} height={4} fill="#f39c12" />
    <Rect x={12} y={36} width={4} height={4} fill="#e67e22" />
    <Rect x={16} y={44} width={4} height={4} fill="#e67e22" />
  </Svg>
);

const Cloud = ({ x, y, size }) => (
  <Svg width={size} height={size / 2} viewBox="0 0 64 32" style={{ position: 'absolute', top: y, left: x }}>
    <Rect x={0} y={16} width={64} height={16} fill="#ecf0f1" />
    <Rect x={8} y={8} width={48} height={16} fill="#ecf0f1" />
    <Rect x={16} y={0} width={32} height={16} fill="#ecf0f1" />
  </Svg>
);

const Tree = ({ x, y, size }) => (
  <Svg width={size} height={size * 1.5} viewBox="0 0 64 96" style={{ position: 'absolute', bottom: y, left: x }}>
    <Rect x={24} y={64} width={16} height={32} fill="#795548" />
    <Polygon points="0,64 32,0 64,64" fill="#2ecc71" />
    <Polygon points="8,96 32,32 56,96" fill="#27ae60" />
  </Svg>
);

export default function App() {
  const [dragonX, setDragonX] = useState(SCREEN_WIDTH / 2);
  const [dragonSize, setDragonSize] = useState(INITIAL_DRAGON_SIZE);
  const [eggs, setEggs] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [clouds] = useState([
    { x: SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.1, size: 100 },
    { x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.2, size: 120 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.15, size: 80 },
  ]);
  const [trees] = useState([
    { x: SCREEN_WIDTH * 0.2, y: 0, size: 80 },
    { x: SCREEN_WIDTH * 0.6, y: 0, size: 100 },
    { x: SCREEN_WIDTH * 0.9, y: 0, size: 60 },
  ]);

  const animationRef = useRef(null);

  const gameLoop = useCallback(() => {
    setTimeLeft((prevTime) => {
      if (prevTime <= 0) {
        endGame('YOU LOST!!!');
        return 0;
      }
      return prevTime - 16; // Approximately 60 FPS
    });

    setEggs((prevEggs) => {
      const newEggs = prevEggs.map((egg) => ({
        ...egg,
        y: egg.y + egg.speed,
      })).filter((egg) => egg.y < SCREEN_HEIGHT);

      if (Math.random() < 0.01) { // Reduced egg spawn rate
        newEggs.push({
          x: Math.random() * (SCREEN_WIDTH - EGG_SIZE),
          y: -EGG_SIZE,
          speed: Math.random() * 4 + 3, // Increased egg speed
        });
      }

      return newEggs;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    if (gameOver) return;

    eggs.forEach((egg) => {
      if (
        Math.abs(dragonX - (egg.x + EGG_SIZE / 2)) < dragonSize / 2 &&
        Math.abs(SCREEN_HEIGHT - dragonSize / 2 - (egg.y + EGG_SIZE / 2)) < dragonSize / 2
      ) {
        setScore((prevScore) => prevScore + 1);
        setDragonSize((prevSize) => prevSize * 1.1);
        setEggs((prevEggs) => prevEggs.filter((e) => e !== egg));
      }
    });

    if (dragonSize >= INITIAL_DRAGON_SIZE * 3) {
      endGame('YOU WON DUDE!');
    }
  }, [eggs, dragonX, dragonSize, gameOver]);

  const endGame = (msg) => {
    setGameOver(true);
    setMessage(msg);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds.toString().padStart(2, '0')}`;
  };

  const handleTouch = (event) => {
    setDragonX(event.nativeEvent.locationX);
  };

  const resetGame = () => {
    setDragonX(SCREEN_WIDTH / 2);
    setDragonSize(INITIAL_DRAGON_SIZE);
    setEggs([]);
    setScore(0);
    setGameOver(false);
    setMessage('');
    setTimeLeft(GAME_DURATION);
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        {clouds.map((cloud, index) => (
          <Cloud key={`cloud-${index}`} {...cloud} />
        ))}
        {trees.map((tree, index) => (
          <Tree key={`tree-${index}`} {...tree} />
        ))}
        <Text style={styles.text}>Score: {score}</Text>
        <Text style={styles.text}>Time: {formatTime(timeLeft)}</Text>
        {eggs.map((egg, index) => (
          <Egg key={`egg-${index}`} x={egg.x} y={egg.y} />
        ))}
        <Dragon size={dragonSize} x={dragonX} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  text: {
    fontFamily: 'Courier',
    fontSize: 20,
    color: 'black',
    margin: 10,
  },
  message: {
    fontFamily: 'Courier',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'red',
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 50,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 + 50,
    left: SCREEN_WIDTH / 2 - 50,
    width: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Courier',
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});