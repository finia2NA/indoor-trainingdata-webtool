In these sessions, we will implement displaying the 360° images that are displayed as spheres in the react-three-fiber viewport.  
The functionality is as follows:
- When clicking on a sphere,
  - The camera should move to the position of the sphere. The orbiting point of the camera should be very close to the new camera position.
  - There is new UI in the overlay (top left) that allows us to exit this state. When this is clicked, the camera returns to the original position and orbiting point.
  - An sphere of radios 0.05 is displayed at the position of the sphere.
    - The texture of this sphere is the texture of the 360° image that is clicked.
    - The opacity of this sphere is 0.5


The goal in general is to have a functionality that allows us to check if the 360° images are aligned correctly with the model.

For this, we will need to:
1. Add functionality to move the camera to the position of the sphere, and a global state to store the return position and orbiting point of the camera.
2. Do this when clicking on a sphere. Implement the UI to go back to the original position.
3. Load the correct texture, and display it as a sphere map when in the 360° view.