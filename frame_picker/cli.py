#!/usr/bin/env python3
"""
Frame Picker CLI - AI-powered video frame selection
"""

import click
import os
from pathlib import Path
from .core import FrameExtractor, FrameSelector


@click.command()
@click.argument('video_path', type=click.Path(exists=True, path_type=Path))
@click.option('--output', '-o', 
              type=click.Path(path_type=Path),
              help='Output path for selected frame (default: same dir as video)')
@click.option('--mode', '-m',
              type=click.Choice(['profile', 'action'], case_sensitive=False),
              default='profile',
              help='Selection mode: profile (face-focused) or action (activity-focused)')
@click.option('--sample-rate', '-s',
              type=int,
              default=30,
              help='Extract every Nth frame for analysis (default: 30)')
@click.option('--quality', '-q',
              type=click.Choice(['fast', 'balanced', 'best'], case_sensitive=False),
              default='balanced',
              help='Analysis quality vs speed trade-off')
def main(video_path, output, mode, sample_rate, quality):
    """
    Extract the best frame from a video for profile pictures or action shots.
    
    VIDEO_PATH: Path to the input video file
    """
    click.echo(f"🎬 Processing video: {video_path}")
    click.echo(f"📊 Mode: {mode.upper()}")
    click.echo(f"⚡ Quality: {quality}")
    
    try:
        # Initialize components
        extractor = FrameExtractor(sample_rate=sample_rate)
        selector = FrameSelector(mode=mode, quality=quality)
        
        # Extract frames from video
        click.echo("🔍 Extracting frames...")
        frames = extractor.extract_frames(video_path)
        
        if not frames:
            click.echo("❌ No frames could be extracted from the video", err=True)
            return
            
        click.echo(f"✅ Extracted {len(frames)} frames for analysis")
        
        # Select best frame
        click.echo("🤖 Analyzing frames...")
        best_frame_data = selector.select_best_frame(frames)
        
        if not best_frame_data:
            click.echo("❌ Could not select a suitable frame", err=True)
            return
            
        # Determine output path
        if not output:
            video_stem = video_path.stem
            output = video_path.parent / f"{video_stem}_best_frame.jpg"
        else:
            # Ensure output has proper extension
            if not output.suffix:
                output = output.with_suffix('.jpg')
                
        # Save the selected frame
        success = best_frame_data['frame'].save(str(output))
        
        if success:
            click.echo(f"🎯 Best frame saved to: {output}")
            click.echo(f"📈 Confidence score: {best_frame_data['score']:.2f}")
            click.echo(f"⏰ Frame timestamp: {best_frame_data['timestamp']:.2f}s")
        else:
            click.echo("❌ Failed to save the selected frame", err=True)
            
    except Exception as e:
        click.echo(f"❌ Error processing video: {str(e)}", err=True)
        raise click.Abort()


if __name__ == '__main__':
    main()
