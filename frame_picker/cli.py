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
@click.option('--count', '-c',
              type=int,
              default=1,
              help='Number of best frames to extract (default: 1)')
@click.option('--min-interval', '-i',
              type=float,
              default=2.0,
              help='Minimum time interval between selected frames in seconds (default: 2.0)')
def main(video_path, output, mode, sample_rate, quality, count, min_interval):
    """
    Extract the best frame(s) from a video for profile pictures or action shots.
    
    VIDEO_PATH: Path to the input video file
    """
    click.echo(f"🎬 Processing video: {video_path}")
    click.echo(f"📊 Mode: {mode.upper()}")
    click.echo(f"⚡ Quality: {quality}")
    click.echo(f"🔢 Extracting top {count} frame{'s' if count > 1 else ''}")
    
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
        
        # Select best frames
        click.echo("🤖 Analyzing frames...")
        best_frames = selector.select_best_frames(frames, count=count, min_interval=min_interval)
        
        if not best_frames:
            click.echo("❌ Could not select suitable frames", err=True)
            return
            
        click.echo(f"🎯 Selected {len(best_frames)} best frame{'s' if len(best_frames) > 1 else ''}")
        
        # Save the selected frames
        saved_files = []
        
        for i, frame_data in enumerate(best_frames):
            if count == 1:
                # Single frame - use provided output path or default
                if not output:
                    video_stem = video_path.stem
                    output_path = video_path.parent / f"{video_stem}_best_frame.jpg"
                else:
                    output_path = output if output.suffix else output.with_suffix('.jpg')
            else:
                # Multiple frames - always add index to filename
                if output:
                    # User provided output path - add index
                    stem = output.stem if output.suffix else str(output)
                    output_path = output.parent / f"{stem}_{i+1:02d}.jpg"
                else:
                    # Default path with index
                    video_stem = video_path.stem
                    output_path = video_path.parent / f"{video_stem}_frame_{i+1:02d}.jpg"
            
            # Save frame
            success = frame_data['frame'].save(str(output_path))
            
            if success:
                saved_files.append(output_path)
                click.echo(f"  📁 Frame {i+1}: {output_path}")
                click.echo(f"     📈 Score: {frame_data['score']:.3f}")
                click.echo(f"     ⏰ Time: {frame_data['timestamp']:.2f}s")
            else:
                click.echo(f"  ❌ Failed to save frame {i+1}", err=True)
        
        if saved_files:
            click.echo(f"\n🎉 Successfully saved {len(saved_files)} frame{'s' if len(saved_files) > 1 else ''}!")
        else:
            click.echo("❌ No frames were saved", err=True)
            
    except Exception as e:
        click.echo(f"❌ Error processing video: {str(e)}", err=True)
        raise click.Abort()


if __name__ == '__main__':
    main()
