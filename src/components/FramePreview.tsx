import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface FramePreviewProps {
  photoUrl?: string;
  frameColor: string;
  frameWidth: number;
  mattingColor?: string;
  mattingThickness?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  onPositionChange?: (position: { x: number; y: number; scale: number; rotation: number }) => void;
}

interface PhotoPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const FramePreview: React.FC<FramePreviewProps> = ({
  photoUrl,
  frameColor = '#8B4513',
  frameWidth = 20,
  mattingColor,
  mattingThickness = 0,
  canvasWidth = 400,
  canvasHeight = 500,
  onPositionChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [photoPosition, setPhotoPosition] = useState<PhotoPosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image when photoUrl changes
  useEffect(() => {
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        
        // Auto-fit image to frame
        const canvas = canvasRef.current;
        if (canvas) {
          const frameArea = {
            width: canvas.width - (frameWidth + mattingThickness) * 2,
            height: canvas.height - (frameWidth + mattingThickness) * 2
          };
          
          const scaleX = frameArea.width / img.width;
          const scaleY = frameArea.height / img.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond original size
          
          setPhotoPosition(prev => ({
            ...prev,
            scale
          }));
        }
      };
      img.onerror = () => {
        console.error('Failed to load image:', photoUrl);
        setImageLoaded(false);
      };
      img.src = photoUrl;
    } else {
      imageRef.current = null;
      setImageLoaded(false);
    }
  }, [photoUrl, frameWidth, mattingThickness]);

  // Draw the frame preview
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const totalFrameWidth = frameWidth + mattingThickness;
    const photoArea = {
      x: totalFrameWidth,
      y: totalFrameWidth,
      width: canvas.width - totalFrameWidth * 2,
      height: canvas.height - totalFrameWidth * 2
    };

    // Draw photo if loaded
    if (imageLoaded && imageRef.current) {
      ctx.save();
      
      // Clip to photo area
      ctx.beginPath();
      ctx.rect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
      ctx.clip();
      
      // Transform for photo positioning
      const centerX = photoArea.x + photoArea.width / 2;
      const centerY = photoArea.y + photoArea.height / 2;
      
      ctx.translate(centerX + photoPosition.x, centerY + photoPosition.y);
      ctx.rotate((photoPosition.rotation * Math.PI) / 180);
      ctx.scale(photoPosition.scale, photoPosition.scale);
      
      const img = imageRef.current;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      ctx.restore();
    }

    // Draw matting if present
    if (mattingColor && mattingThickness > 0) {
      ctx.fillStyle = mattingColor;
      
      // Outer matting rectangle
      ctx.fillRect(frameWidth, frameWidth, 
        canvas.width - frameWidth * 2, 
        canvas.height - frameWidth * 2
      );
      
      // Cut out inner rectangle for photo
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
      ctx.restore();
    }

    // Draw frame
    ctx.fillStyle = frameColor;
    
    // Outer frame
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cut out inner area (matting or photo area)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const innerArea = mattingColor ? 
      { x: frameWidth, y: frameWidth, width: canvas.width - frameWidth * 2, height: canvas.height - frameWidth * 2 } :
      photoArea;
    ctx.fillRect(innerArea.x, innerArea.y, innerArea.width, innerArea.height);
    ctx.restore();

    // Draw placeholder if no photo
    if (!imageLoaded) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
      
      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a photo', 
        photoArea.x + photoArea.width / 2, 
        photoArea.y + photoArea.height / 2
      );
    }
  }, [imageLoaded, photoPosition, frameColor, frameWidth, mattingColor, mattingThickness]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - photoPosition.x,
        y: e.clientY - rect.top - photoPosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragStart.x;
    const newY = e.clientY - rect.top - dragStart.y;
    
    const newPosition = { ...photoPosition, x: newX, y: newY };
    setPhotoPosition(newPosition);
    onPositionChange?.(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Control handlers
  const handleScaleChange = (value: number[]) => {
    const newPosition = { ...photoPosition, scale: value[0] };
    setPhotoPosition(newPosition);
    onPositionChange?.(newPosition);
  };

  const handleRotationChange = (value: number[]) => {
    const newPosition = { ...photoPosition, rotation: value[0] };
    setPhotoPosition(newPosition);
    onPositionChange?.(newPosition);
  };

  const resetPosition = () => {
    const newPosition = { x: 0, y: 0, scale: 1, rotation: 0 };
    setPhotoPosition(newPosition);
    onPositionChange?.(newPosition);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-border rounded-lg cursor-move mx-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {!photoUrl && (
              <p className="text-sm text-muted-foreground mt-2">
                Upload a photo to see the preview
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {imageLoaded && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">Photo Controls</h4>
            
            {/* Scale Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Size</label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(photoPosition.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[photoPosition.scale]}
                  onValueChange={handleScaleChange}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-sm text-muted-foreground">
                  {photoPosition.rotation}°
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                <Slider
                  value={[photoPosition.rotation]}
                  onValueChange={handleRotationChange}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPosition}
                className="flex-1"
              >
                <Move className="h-4 w-4 mr-2" />
                Reset Position
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Drag the photo to reposition, or use the controls above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FramePreview;