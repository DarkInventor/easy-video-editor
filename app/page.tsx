"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@radix-ui/react-slider';
import ReactPlayer from 'react-player';
import { Timeline, TimelineEffect, TimelineRow } from '@xzdarcy/react-timeline-editor';

const VideoEditor: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [playing, setPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [editorData, setEditorData] = useState<TimelineRow[]>([]);

  const playerRef = useRef<ReactPlayer>(null);
  const timelineRef = useRef<any>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
    }
  }, [videoFile]);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
    }
  }, [audioFile]);

  useEffect(() => {
    if (duration > 0) {
      setEditorData([
        {
          id: 'video',
          actions: [{ id: 'videoAction', start: 0, end: duration, effectId: 'videoEffect' }],
        },
        {
          id: 'audio',
          actions: [{ id: 'audioAction', start: 0, end: duration, effectId: 'audioEffect' }],
        },
      ]);
    }
  }, [duration]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    if (timelineRef.current) {
      timelineRef.current.setTime(state.playedSeconds);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
    setTrimEnd(duration);
  };

  const handleSeek = (time: number) => {
    playerRef.current?.seekTo(time, 'seconds');
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const handleTrimChange = (values: [number, number]) => {
    setTrimStart(values[0]);
    setTrimEnd(values[1]);
  };

  const handleCropChange = (property: keyof typeof crop, value: number) => {
    setCrop(prev => ({ ...prev, [property]: value }));
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds();
    return hh ? `${hh}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}` : `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 flex">
        <div className="w-3/4 bg-black p-4">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            volume={volume}
            playbackRate={playbackRate}
            onProgress={handleProgress}
            onDuration={handleDuration}
            width="100%"
            height="100%"
            style={{
              clipPath: `inset(${crop.y}% ${100 - crop.width - crop.x}% ${100 - crop.height - crop.y}% ${crop.x}%)`,
            }}
          />
        </div>
        <div className="w-1/4 bg-white p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Media</h2>
          <Input type="file" accept="video/*" onChange={handleVideoUpload} className="mb-2" />
          <Input type="file" accept="audio/*" onChange={handleAudioUpload} className="mb-4" />
          
          <h2 className="text-xl font-bold mb-2">Volume</h2>
          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="mb-4"
          />
          
          <h2 className="text-xl font-bold mb-2">Playback Speed</h2>
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4"
          >
            {[0.5, 1, 1.5, 2].map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
          
          <h2 className="text-xl font-bold mb-2">Crop</h2>
          {Object.entries(crop).map(([key, value]) => (
            <div key={key} className="mb-2">
              <label className="block text-sm font-medium text-gray-700">{key}</label>
              <Slider
                value={[value]}
                max={100}
                step={1}
                onValueChange={(newValue) => handleCropChange(key as keyof typeof crop, newValue[0])}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="h-48 bg-gray-800 p-4 ">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={handlePlayPause}>{playing ? 'Pause' : 'Play'}</Button>
          <div className="text-white">{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>
        <Timeline      
          ref={timelineRef}
          editorData={editorData}
          effects={{}}
          onChange={(data) => setEditorData(data)}
          onUpdateTime={handleSeek}
          style={{ height: '100px', overflow: 'auto', width: 'auto' }} // Made scrollable by adding overflow: 'auto'
          timelineStyle={{
            background: '#2D3748',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
          cursorStyle={{ // Added cursor style to show cursor on the timeline
            height: '100%',
            width: '',
            background: '#F56565',
          }}
          scrollable={true}
          slidable={true}
          timeFormat="hours"
        />
        </div>
    </div>
  );
};

export default VideoEditor;