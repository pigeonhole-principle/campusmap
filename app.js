// Global variables
let campusData;
let selectedCourses = [];

// Load campus data from YAML file
async function loadCampusData() {
    const response = await fetch('campus_data.yaml');
    const yamlText = await response.text();
    campusData = jsyaml.load(yamlText);
    displayCourseList();
    displayCampusMap();
}

// Display the list of courses and classrooms
function displayCourseList() {
    const courseListElement = document.getElementById('course-list');
    courseListElement.innerHTML = '<h2>Available Courses:</h2>';
    
    for (const building in campusData.buildings) {
        for (const classroom in campusData.buildings[building].classrooms) {
            const courses = campusData.buildings[building].classrooms[classroom].courses;
            courses.forEach(course => {
                const courseItem = document.createElement('div');
                courseItem.innerHTML = `
                    <input type="checkbox" id="${course}" name="${course}">
                    <label for="${course}">${course} - ${building}, Room ${classroom}</label>
                `;
                courseItem.querySelector('input').addEventListener('change', (e) => toggleCourseSelection(e, course, building, classroom));
                courseListElement.appendChild(courseItem);
            });
        }
    }
}

// Toggle course selection
function toggleCourseSelection(event, course, building, classroom) {
    if (event.target.checked) {
        if (selectedCourses.length < 6) {
            selectedCourses.push({ course, building, classroom });
        } else {
            event.target.checked = false;
            alert('You can only select up to 6 courses.');
        }
    } else {
        selectedCourses = selectedCourses.filter(c => c.course !== course);
    }
    updateSelectedCourses();
}

// Update the display of selected courses
function updateSelectedCourses() {
    const selectedCoursesElement = document.getElementById('selected-courses');
    selectedCoursesElement.innerHTML = '<h2>Selected Courses:</h2>';
    selectedCourses.forEach(course => {
        selectedCoursesElement.innerHTML += `<p>${course.course} - ${course.building}, Room ${course.classroom}</p>`;
    });
}

// Display the campus map
function displayCampusMap() {
    const campusMapElement = document.getElementById('campus-map');
    campusMapElement.innerHTML = '';

    for (const building in campusData.buildings) {
        const buildingData = campusData.buildings[building];
        const buildingElement = document.createElement('div');
        buildingElement.className = 'building';
        buildingElement.style.left = `${buildingData.x}px`;
        buildingElement.style.top = `${buildingData.y}px`;
        buildingElement.style.width = `${buildingData.width}px`;
        buildingElement.style.height = `${buildingData.height}px`;

        // Add building label
        const buildingLabel = document.createElement('div');
        buildingLabel.className = 'building-label';
        buildingLabel.innerText = building;
        buildingElement.appendChild(buildingLabel);

        // Add hallways
        buildingData.hallways.forEach(hallway => {
            const hallwayElement = document.createElement('div');
            hallwayElement.className = 'hallway';
            hallwayElement.style.left = `${hallway.x}px`;
            hallwayElement.style.top = `${hallway.y}px`;
            hallwayElement.style.width = `${hallway.width}px`;
            hallwayElement.style.height = `${hallway.height}px`;
            buildingElement.appendChild(hallwayElement);
        });

        // Add classrooms
        for (const classroom in buildingData.classrooms) {
            const classroomData = buildingData.classrooms[classroom];
            const classroomElement = document.createElement('div');
            classroomElement.className = 'classroom';
            classroomElement.style.left = `${classroomData.x}px`;
            classroomElement.style.top = `${classroomData.y}px`;
            classroomElement.style.width = `${classroomData.width}px`;
            classroomElement.style.height = `${classroomData.height}px`;
            classroomElement.innerText = classroom;
            classroomElement.title = `${building} - Room ${classroom}\nCourses: ${classroomData.courses.join(', ')}`;
            
            classroomElement.addEventListener('click', () => {
                alert(`${building} - Room ${classroom}\nCourses: ${classroomData.courses.join(', ')}`);
            });

            buildingElement.appendChild(classroomElement);
        }

        campusMapElement.appendChild(buildingElement);
    }
}

// Calculate and display the optimal path
function calculateOptimalPath() {
    if (selectedCourses.length === 0) {
        alert("Please select at least one course.");
        return;
    }

    const optimalPath = findShortestPath(selectedCourses);
    displayOptimalPath(optimalPath);
}

// Placeholder function for finding the shortest path
function findShortestPath(courses) {
    // This is a placeholder. In a real implementation, you would use a proper pathfinding algorithm.
    return courses;
}

// Display the optimal path on the campus map
function displayOptimalPath(path) {
    const campusMapElement = document.getElementById('campus-map');
    const optimalPathElement = document.getElementById('optimal-path');
    
    // Clear previous optimal path information
    optimalPathElement.innerHTML = '<h2>Optimal Path:</h2>';
    
    // Remove existing sequence labels and paths
    document.querySelectorAll('.sequence-label, .path').forEach(el => el.remove());

    path.forEach((course, index) => {
        optimalPathElement.innerHTML += `<p>${index + 1}. ${course.course} - ${course.building}, Room ${course.classroom}</p>`;

        const buildingData = campusData.buildings[course.building];
        const classroomData = buildingData.classrooms[course.classroom];
        
        // Find and label the classroom
        const classroomElements = document.querySelectorAll('.classroom');
        classroomElements.forEach(classroomElement => {
            if (classroomElement.innerText === course.classroom && 
                classroomElement.closest('.building').querySelector('.building-label').innerText === course.building) {
                
                // Create a label for sequence number on the classroom
                const sequenceLabel = document.createElement('div');
                sequenceLabel.className = 'sequence-label';
                sequenceLabel.style.position = 'absolute';
                sequenceLabel.style.zIndex = '12';
                sequenceLabel.innerText = index + 1;

                // Position the label in the top-left corner of the classroom
                sequenceLabel.style.left = '2px';
                sequenceLabel.style.top = '2px';

                classroomElement.appendChild(sequenceLabel);
            }
        });

        // Draw path to next classroom
        if (index < path.length - 1) {
            const nextCourse = path[index + 1];
            const nextBuildingData = campusData.buildings[nextCourse.building];
            const nextClassroomData = nextBuildingData.classrooms[nextCourse.classroom];

            const startX = buildingData.x + classroomData.x + classroomData.width / 2;
            const startY = buildingData.y + classroomData.y + classroomData.height / 2;
            const endX = nextBuildingData.x + nextClassroomData.x + nextClassroomData.width / 2;
            const endY = nextBuildingData.y + nextClassroomData.y + nextClassroomData.height / 2;

            const pathLine = document.createElement('div');
            pathLine.className = 'path';
            const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX);

            pathLine.style.left = `${startX}px`;
            pathLine.style.top = `${startY}px`;
            pathLine.style.width = `${length}px`;
            pathLine.style.transformOrigin = '0 0';
            pathLine.style.transform = `rotate(${angle}rad)`;

            campusMapElement.appendChild(pathLine);
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadCampusData);
document.getElementById('calculate-path').addEventListener('click', calculateOptimalPath);
