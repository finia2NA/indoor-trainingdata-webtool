# Screenshot Generation Flow - Sequence Diagram

This sequence diagram shows the complete flow from user clicking "Take Screenshots" through to ZIP file download, including both mesh screenshots (shaded/unshaded variants) and 360° screenshots with all their rendering processes.

```mermaid
sequenceDiagram
    participant User
    participant GenerateSidebar
    participant useDataGeneratorUtils
    participant ProgressToast
    participant useOffscreenThree
    participant SceneManager
    participant Database
    participant get360s
    participant FileSystem

    %% TAKE SCREENSHOTS FLOW
    User->>GenerateSidebar: Click "Take Screenshots"
    GenerateSidebar->>useDataGeneratorUtils: takeScreenshots()
    useDataGeneratorUtils->>FileSystem: create ZIP with timestamp
    
    par Mesh Screenshots
        useDataGeneratorUtils->>useOffscreenThree: takeOffscreenScreenshots(poses, width, height)
        useOffscreenThree->>ProgressToast: show progress (screenshots)
        
        alt If 360° shading enabled
            useOffscreenThree->>useOffscreenThree: takeOffscreenScreenshotsShaded()
            
            Note over useOffscreenThree,Database: Load 360° images for lighting
            useOffscreenThree->>get360s: get360s(project, withImages=true)
            get360s->>Database: db.getImages360(projectId)
            Database-->>get360s: 360° image blobs
            get360s->>get360s: load textures via THREE.TextureLoader
            get360s-->>useOffscreenThree: 360° images with textures
            
            useOffscreenThree->>SceneManager: getOrCreateScene(width, height, doubleSided=false, use360Shading=true)
            SceneManager-->>useOffscreenThree: scene with 3D models
            
            Note over useOffscreenThree: Creates multiple render targets per pose<br/>Uses 360° images as lighting sources<br/>Composites final image via post-processing
            
            loop For each pose
                useOffscreenThree->>useOffscreenThree: find nearby 360° images
                useOffscreenThree->>useOffscreenThree: create point lights at 360° positions
                
                loop For each light
                    useOffscreenThree->>useOffscreenThree: render to separate target
                end
                
                useOffscreenThree->>useOffscreenThree: composite via post-processing quad
                useOffscreenThree->>ProgressToast: update progress
            end
        else Ambient lighting only
            useOffscreenThree->>useOffscreenThree: takeOffscreenScreenshotsAmbient()
            useOffscreenThree->>SceneManager: getOrCreateScene(width, height, doubleSided=false)
            SceneManager-->>useOffscreenThree: scene with 3D models
            
            loop For each pose
                useOffscreenThree->>useOffscreenThree: render with ambient lighting
                useOffscreenThree->>ProgressToast: update progress
            end
        end
        
        useOffscreenThree->>FileSystem: save screenshots to mesh folder
        useOffscreenThree->>FileSystem: save pose metadata (JSON)
        useOffscreenThree->>ProgressToast: dismiss toast
        useOffscreenThree->>User: "Screenshots complete"
    
    and 360° Screenshots
        alt If posttraining poses exist
            useDataGeneratorUtils->>useOffscreenThree: take360Screenshots(posttrainingPoses, width, height)
            
            Note over useOffscreenThree,Database: Load and validate 360° images
            useOffscreenThree->>get360s: get360s(project, withImages=true)
            get360s->>Database: db.getImages360(projectId)
            Database-->>get360s: 360° image blobs
            get360s->>get360s: load textures via THREE.TextureLoader
            get360s-->>useOffscreenThree: 360° images with textures
            
            useOffscreenThree->>useOffscreenThree: createScene360(width, height)
            Note over useOffscreenThree: Creates sphere scene for 360° rendering
            
            useOffscreenThree->>ProgressToast: show progress (360° screenshots)
            
            loop For each posttraining pose
                useOffscreenThree->>useOffscreenThree: load corresponding 360° image texture
                useOffscreenThree->>useOffscreenThree: apply texture to sphere
                useOffscreenThree->>useOffscreenThree: rotate sphere by course value
                useOffscreenThree->>useOffscreenThree: render from pose perspective
                useOffscreenThree->>ProgressToast: update progress
            end
            
            useOffscreenThree->>FileSystem: save screenshots to posttraining folder
            useOffscreenThree->>FileSystem: save pose metadata (JSON)
            useOffscreenThree->>ProgressToast: dismiss toast
            useOffscreenThree->>User: "Screenshots complete"
        end
    end
    
    useDataGeneratorUtils->>FileSystem: finalize and download ZIP
    useDataGeneratorUtils->>User: Download "screenshots.zip"

    %% OPTIONAL USER INTERACTIONS
    Note over User,ProgressToast: User can click "Stop" on any progress toast
    ProgressToast-->>useDataGeneratorUtils: stop signal
    useDataGeneratorUtils->>User: "Process stopped"
```

## Key Flow Points

### Screenshot Types and Variants

#### Mesh Screenshots
1. **Shaded Variant**:
   - Loads 360° images from database with full textures
   - Creates complex lighting setup using 360° images as point light sources
   - Multiple render targets per pose for different light contributions
   - Post-processing compositing for final image output

2. **Unshaded Variant**:
   - Simple ambient lighting without 360° image integration
   - Single render pass per pose
   - Faster rendering pipeline

#### 360° Screenshots
1. **Spherical Environment Rendering**:
   - Uses dedicated sphere scene with 360° image textures
   - Camera positioned at origin, looking outward at textured sphere
   - Texture rotation based on course metadata
   - Specialized for posttraining pose perspectives

### File Organization
1. **ZIP Structure**:
   ```
   screenshots_[timestamp]/
   ├── mesh/
   │   ├── screenshot_[series][a/b].png
   │   └── screenshot_[series][a/b].json
   └── posttraining/
       ├── screenshot_[series][a/b].png
       └── screenshot_[series][a/b].json
   ```

2. **Metadata Storage**:
   - JSON files contain pose data, camera settings, and image dimensions
   - Enables reconstruction of camera positions for analysis

### Scene Management
- **Mesh Rendering**: Uses SceneManager for cached 3D model scenes
- **360° Rendering**: Creates dedicated sphere scenes with texture management
- **Performance**: Scene reuse across multiple poses reduces setup overhead

### Progress Management
- **Parallel Execution**: Mesh and 360° screenshots generated simultaneously
- **Real-time Updates**: Progress bars show completion percentage
- **User Control**: Stop functionality available during long operations
- **Success Feedback**: Toast notifications for completion status

### Key Technical Details
- **Render Targets**: Multiple framebuffers for advanced lighting effects
- **Texture Loading**: THREE.TextureLoader for 360° image processing
- **Post-processing**: Shader-based compositing for shaded variants
- **Memory Management**: Proper cleanup of textures and render targets