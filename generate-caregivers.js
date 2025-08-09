// Script to generate 30 caregivers with Ghanaian names and locations
// Run with: bun generate-caregivers.js

const BASE_URL = 'http://localhost:12345/api';

// Ghanaian names (first names and surnames)
const firstNames = [
  'Kwame', 'Kofi', 'Kwesi', 'Kwaku', 'Yaw', 'Kobena', 'Kwadwo', 'Kwabena',
  'Ama', 'Abena', 'Akua', 'Adwoa', 'Yaa', 'Afua', 'Aba', 'Akosua',
  'Nana', 'Nii', 'Tetteh', 'Mensah', 'Owusu', 'Addo', 'Sarpong', 'Darko',
  'Osei', 'Boateng', 'Asante', 'Mensah', 'Owusu', 'Addo', 'Sarpong', 'Darko'
];

const surnames = [
  'Mensah', 'Owusu', 'Addo', 'Sarpong', 'Darko', 'Osei', 'Boateng', 'Asante',
  'Tetteh', 'Nkrumah', 'Kufuor', 'Rawlings', 'Mahama', 'Akufo-Addo', 'Mills',
  'Kufuor', 'Rawlings', 'Mahama', 'Akufo-Addo', 'Mills', 'Kufuor', 'Rawlings',
  'Mahama', 'Akufo-Addo', 'Mills', 'Kufuor', 'Rawlings', 'Mahama', 'Akufo-Addo'
];

// Ghanaian locations
const locations = [
  'Accra, Greater Accra', 'Kumasi, Ashanti', 'Tamale, Northern', 'Sekondi-Takoradi, Western',
  'Cape Coast, Central', 'Sunyani, Bono', 'Ho, Volta', 'Koforidua, Eastern',
  'Wa, Upper West', 'Bolgatanga, Upper East', 'Tema, Greater Accra', 'Tarkwa, Western',
  'Obuasi, Ashanti', 'Kintampo, Bono East', 'Techiman, Bono', 'Dunkwa, Central',
  'Axim, Western', 'Saltpond, Central', 'Winneba, Central', 'Mampong, Ashanti',
  'Konongo, Ashanti', 'Ejura, Ashanti', 'Bekwai, Ashanti', 'Agogo, Ashanti',
  'Mampong, Ashanti', 'Konongo, Ashanti', 'Ejura, Ashanti', 'Bekwai, Ashanti',
  'Agogo, Ashanti', 'Mampong, Ashanti'
];

// Caregiver types (values match frontend)
const caregiverTypes = [
  'nurse',
  'doctor',
  'trained caregiver',
  'individual'
];

// Education levels (values match frontend)
const educationLevels = [
  'Primary',
  'JHS',
  'SHS',
  'Tertiary'
];

// Schedules (values match frontend)
const schedules = [
  'Full-time',
  'week-days',
  'week-ends',
  'Emergency'
];

// Specializations (values match frontend)
const specializations = [
  'Cancer',
  'Stroke',
  'Dementia',
  'Heart Disease',
  'Diabetes',
  'General',
  'Other'
];

// Bio templates
const bioTemplates = [
  'Experienced caregiver with a passion for helping others. Specialized in elderly care and medication management.',
  'Compassionate healthcare professional with strong communication skills. Experienced in wound care and patient education.',
  'Dedicated caregiver with expertise in dementia care and behavioral management. Committed to improving quality of life.',
  'Skilled nursing professional with experience in rehabilitation and post-surgical care. Patient-focused approach.',
  'Certified caregiver with background in pediatric care and special needs support. Gentle and patient with children.',
  'Experienced in palliative care and end-of-life support. Provides emotional and physical comfort to patients and families.',
  'Specialized in chronic disease management and medication administration. Strong attention to detail and safety protocols.',
  'Healthcare professional with expertise in mobility assistance and physical therapy support. Encourages independence.',
  'Compassionate caregiver with experience in mental health support and behavioral intervention. Patient advocate.',
  'Skilled in medical equipment operation and monitoring. Experienced in ICU and critical care settings.'
];

// Generic function to get random value from array
function getRandomInArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomName() {
  const firstName = getRandomInArray(firstNames);
  const surname = getRandomInArray(surnames);
  return `${firstName} ${surname}`;
}

function generateRandomEmail(fullname) {
  const name = fullname.toLowerCase().replace(/\s+/g, '');
  const randomNum = Math.floor(Math.random() * 1000);
  return `${name}${randomNum}@ghana.com`;
}

function generateRandomLocation() {
  return getRandomInArray(locations);
}

function generateRandomCaregiverType() {
  return getRandomInArray(caregiverTypes);
}

function generateRandomEducationLevel() {
  return getRandomInArray(educationLevels);
}

function generateRandomSchedule() {
  return getRandomInArray(schedules);
}

function generateRandomSpecialization() {
  return getRandomInArray(specializations);
}

function generateRandomBio() {
  return getRandomInArray(bioTemplates);
}

async function registerUser(fullname, email) {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: '12345678',
        fullname: fullname,
        role: 'caregiver'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Registration failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`✅ Registered: ${fullname} (${email})`);
    return data.token.accessToken;
  } catch (error) {
    console.error(`❌ Failed to register ${fullname}:`, error.message);
    return null;
  }
}

async function updateUserProfile(token, fullname, location) {
  try {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullname: fullname,
        location: location
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Profile update failed: ${JSON.stringify(errorData)}`);
    }

    console.log(`✅ Updated profile for: ${fullname}`);
  } catch (error) {
    console.error(`❌ Failed to update profile for ${fullname}:`, error.message);
  }
}

async function updateCaregiverProfile(token, type, schedule, bio, educationLevel, specialization) {
  try {
    const response = await fetch(`${BASE_URL}/profile/caregiver`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: type,
        schedule: schedule,
        bio: bio,
        educationLevel: educationLevel,
        specialization: specialization
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Caregiver profile update failed: ${JSON.stringify(errorData)}`);
    }

    console.log(`✅ Updated caregiver profile for: ${type} (${specialization})`);
  } catch (error) {
    console.error(`❌ Failed to update caregiver profile:`, error.message);
  }
}

async function generateCaregiver(index) {
  console.log(`\n🔄 Generating caregiver ${index + 1}/30...`);
  
  const fullname = generateRandomName();
  const email = generateRandomEmail(fullname);
  const location = generateRandomLocation();
  const type = generateRandomCaregiverType();
  const schedule = generateRandomSchedule();
  const bio = generateRandomBio();
  const educationLevel = generateRandomEducationLevel();
  const specialization = generateRandomSpecialization();

  console.log(`📝 Generated data for: ${fullname}`);
  console.log(`   Email: ${email}`);
  console.log(`   Location: ${location}`);
  console.log(`   Type: ${type}`);
  console.log(`   Specialization: ${specialization}`);

  // Register the user
  const token = await registerUser(fullname, email);
  if (!token) {
    console.log(`⏭️  Skipping caregiver ${index + 1} due to registration failure`);
    return;
  }



  // Update user profile
  await updateUserProfile(token, fullname, location);

  // Update caregiver profile
  await updateCaregiverProfile(token, type, schedule, bio, educationLevel, specialization);

  console.log(`✅ Completed caregiver ${index + 1}: ${fullname}`);
}

async function main() {
  console.log('🚀 Starting caregiver generation script...');
  console.log(`📊 Target: 30 caregivers`);
  console.log(`🌍 Location: Ghana`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log('=' * 50);

  const caregivers = [];
  
  for (let i = 0; i < 30; i++) {
    await generateCaregiver(i);
    
    // Add a small delay between requests to avoid overwhelming the server
    if (i < 29) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n🎉 Script completed!');
  console.log(`✅ Generated ${caregivers.length} caregivers`);
  console.log('📋 All caregivers use password: 12345678');
}

// Run the script
main().catch(console.error); 
