import { pipeline, env } from '@xenova/transformers';
import { Patient, CaregiverProfile, Qualification, User } from '@prisma/client';

// Configure transformers to use local models if available
env.allowLocalModels = true;
env.allowRemoteModels = true;

interface CaregiverWithScore extends CaregiverProfile {
  score: number;
  user?: Partial<User>;
  qualifications?: Qualification[];
}

interface PatientWithUser extends Patient {
  user?: Partial<User>;
}

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Computes location similarity score (0-1) for Ghanaian locations
 * Returns 1 if locations match exactly, 0.9 if same district, 0.7 if same region, 0.5 if nearby region, 0.3 if same zone
 */
function computeLocationSimilarity(patientLocation?: string | null, caregiverLocation?: string | null): number {
  if (!patientLocation || !caregiverLocation) {
    return 0.1; // Small score for missing location data
  }
  
  const patientLoc = patientLocation.toLowerCase().trim();
  const caregiverLoc = caregiverLocation.toLowerCase().trim();
  
  if (patientLoc === caregiverLoc) {
    return 1.0; // Exact match
  }
  
  // Check if one location contains the other (e.g., "Accra" vs "Accra, Greater Accra")
  if (patientLoc.includes(caregiverLoc) || caregiverLoc.includes(patientLoc)) {
    return 0.9; // Very close match
  }
  
  // Ghanaian Regions
  const ghanaRegions = {
    'greater accra': ['accra', 'tema', 'ashaiman', 'madina', 'adenta', 'dodowa', 'prampram', 'ningo', 'ada'],
    'ashanti': ['kumasi', 'obuasi', 'konongo', 'ejisu', 'mampong', 'bekwai', 'offinso', 'afigya-kwabre'],
    'western': ['takoradi', 'sekondi', 'tarkwa', 'prestea', 'bogoso', 'axim', 'elubo', 'half assini'],
    'central': ['cape coast', 'saltpond', 'winneba', 'agona swedru', 'dunkwa', 'assin fosu', 'mankessim'],
    'eastern': ['koforidua', 'nsawam', 'suhum', 'akropong', 'aburi', 'mamfe', 'akim oda', 'kibi'],
    'volta': ['ho', 'keta', 'akatsi', 'hohoe', 'kpeve', 'anloga', 'ave', 'kadjebi'],
    'northern': ['tamale', 'yendi', 'savelugu', 'bimbilla', 'damongo', 'salaga', 'buipe', 'saboba'],
    'upper east': ['bolgatanga', 'navrongo', 'bawku', 'zebilla', 'binduri', 'garu', 'tempane'],
    'upper west': ['wa', 'tumu', 'lawra', 'jirapa', 'nandom', 'hamile', 'funsi'],
    'bono': ['sunyani', 'techiman', 'wenchi', 'bechem', 'duayaw nkwanta', 'nkrankwanta', 'sampa'],
    'bono east': ['techiman', 'kintampo', 'nkoranza', 'ahenkro', 'prang', 'yeji', 'kwame danso'],
    'ahafo': ['goaso', 'duayaw nkwanta', 'kenyasi', 'hwidiem', 'kukuom', 'bechem'],
    'western north': ['sefwi wiawso', 'bibiani', 'enchi', 'juaboso', 'akontombra', 'bodi'],
    'savannah': ['damongo', 'buipe', 'salaga', 'sawla', 'fulfulso', 'larabanga'],
    'north east': ['nalerigu', 'gambaga', 'walewale', 'bunkpurugu', 'nakpanduri', 'chereponi'],
    'oti': ['dambai', 'krachi', 'nkwanta', 'kadjebi', 'worawora', 'jasikan'],
    'ono': ['agona swedru', 'mankessim', 'asamankese', 'akim oda', 'kibi', 'akropong']
  };

  // Major cities and their regions
  const majorCities = {
    'accra': 'greater accra',
    'kumasi': 'ashanti', 
    'tamale': 'northern',
    'takoradi': 'western',
    'cape coast': 'central',
    'koforidua': 'eastern',
    'ho': 'volta',
    'sunyani': 'bono',
    'bolgatanga': 'upper east',
    'wa': 'upper west',
    'tema': 'greater accra',
    'obuasi': 'ashanti',
    'tarkwa': 'western',
    'winneba': 'central',
    'nsawam': 'eastern',
    'keta': 'volta',
    'yendi': 'northern',
    'navrongo': 'upper east',
    'tumu': 'upper west',
    'techiman': 'bono'
  };

  // Check for exact region match
  for (const [region, cities] of Object.entries(ghanaRegions)) {
    const patientInRegion = region === patientLoc || cities.some(city => patientLoc.includes(city));
    const caregiverInRegion = region === caregiverLoc || cities.some(city => caregiverLoc.includes(city));
    
    if (patientInRegion && caregiverInRegion) {
      // Check if they're in the same city/district
      const patientCity = cities.find(city => patientLoc.includes(city));
      const caregiverCity = cities.find(city => caregiverLoc.includes(city));
      
      if (patientCity && caregiverCity && patientCity === caregiverCity) {
        return 0.95; // Same city/district
      }
      
      return 0.7; // Same region
    }
  }

  // Check for major city matches
  const patientCity = Object.keys(majorCities).find(city => patientLoc.includes(city));
  const caregiverCity = Object.keys(majorCities).find(city => caregiverLoc.includes(city));
  
  if (patientCity && caregiverCity) {
    if (patientCity === caregiverCity) {
      return 0.95; // Same major city
    }
    
    // Check if they're in the same region
    const patientRegion = majorCities[patientCity];
    const caregiverRegion = majorCities[caregiverCity];
    
    if (patientRegion === caregiverRegion) {
      return 0.7; // Same region, different cities
    }
  }

  // Check for nearby regions (geographic proximity)
  const nearbyRegions = {
    'greater accra': ['central', 'eastern'],
    'ashanti': ['bono', 'eastern', 'bono east'],
    'western': ['central', 'western north'],
    'central': ['greater accra', 'western', 'eastern'],
    'eastern': ['greater accra', 'central', 'ashanti', 'volta'],
    'volta': ['eastern', 'oti'],
    'northern': ['savannah', 'north east', 'upper east'],
    'upper east': ['northern', 'upper west', 'north east'],
    'upper west': ['upper east', 'savannah'],
    'bono': ['ashanti', 'bono east', 'ahafo'],
    'bono east': ['ashanti', 'bono', 'oti'],
    'ahafo': ['bono', 'ashanti'],
    'western north': ['western', 'bono'],
    'savannah': ['northern', 'upper west'],
    'north east': ['northern', 'upper east'],
    'oti': ['volta', 'bono east'],
    'ono': ['central', 'eastern']
  };

  // Find regions for both locations
  let patientRegion = '';
  let caregiverRegion = '';

  for (const [region, cities] of Object.entries(ghanaRegions)) {
    if (region === patientLoc || cities.some(city => patientLoc.includes(city))) {
      patientRegion = region;
    }
    if (region === caregiverLoc || cities.some(city => caregiverLoc.includes(city))) {
      caregiverRegion = region;
    }
  }

  // Check for nearby regions
  if (patientRegion && caregiverRegion) {
    if (patientRegion === caregiverRegion) {
      return 0.7; // Same region
    }
    
    const patientNearby = nearbyRegions[patientRegion] || [];
    if (patientNearby.includes(caregiverRegion)) {
      return 0.5; // Nearby regions
    }
  }

  // Check for common words (district names, etc.)
  const patientWords = patientLoc.split(/[\s,]+/).filter(word => word.length > 2);
  const caregiverWords = caregiverLoc.split(/[\s,]+/).filter(word => word.length > 2);
  
  if (patientWords.length > 0 && caregiverWords.length > 0) {
    const commonWords = patientWords.filter(word => caregiverWords.includes(word));
    const totalWords = Math.max(patientWords.length, caregiverWords.length);
    const similarityRatio = commonWords.length / totalWords;
    
    if (similarityRatio >= 0.3) {
      return 0.4; // Some common words
    }
  }

  return 0.1; // No significant match
}

/**
 * Creates a comprehensive text representation of a patient for matching,
 * including field names for clarity.
 */
function createPatientText(patient: PatientWithUser): string {
  const fields = [
    `condition: ${patient.condition}`,
    `years: ${patient.years}`,
    `schedule: ${patient.schedule}`,
    `description: ${patient.description || ''}`,
    `special: ${patient.special || ''}`,
    `medicalHistory: ${patient.medicalHistory || ''}`,
    patient.user?.location ? `location: ${patient.user.location}` : ''
  ].filter(Boolean);

  return fields.join(' | ');
}

/**
 * Creates a comprehensive text representation of a caregiver for matching,
 * including field names and qualification titles if present.
 * Accepts a CaregiverProfile with an optional 'qualifications' array and user info.
 */
function createCaregiverText(
  caregiver: CaregiverProfile & { qualifications?: Qualification[]; user?: Partial<User> }
): string {
  const qualificationTitles = caregiver.qualifications
    ? caregiver.qualifications.map(q => q.title).filter(Boolean)
    : [];

  const fields = [
    `type: ${caregiver.type || ''}`,
    `bio: ${caregiver.bio || ''}`,
    `educationLevel: ${caregiver.educationLevel || ''}`,
    `schedule: ${caregiver.schedule || ''}`,
    caregiver.user?.location ? `location: ${caregiver.user.location}` : '',
    qualificationTitles.length > 0
      ? `qualifications: ${qualificationTitles.join(', ')}`
      : ''
  ].filter(Boolean);

  return fields.join(' | ');
}

/**
 * Generates embeddings for a text using the specified model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Matches caregivers to a patient using semantic similarity and location
 * Returns caregivers sorted by match score (highest first)
 */
export async function matchCaregiverProfiles(
  patient: PatientWithUser,
  caregivers: (CaregiverProfile & { user?: Partial<User>; qualifications?: Qualification[] })[],
  minScore: number = 0.0 // Acceptable minimum score, default to 0.0 if not provided
): Promise<CaregiverWithScore[]> {
  console.log('[MATCH] Starting caregiver matching process...');
  if (caregivers.length === 0) {
    console.log('[MATCH] No caregivers provided, returning empty array.');
    return [];
  }

  try {
    // Create text representations
    console.log('[MATCH] Creating patient text representation...');
    const patientText = createPatientText(patient);
    console.log('[MATCH] Patient text:', patientText);

    console.log('[MATCH] Generating embedding for patient...');
    const patientEmbedding = await generateEmbedding(patientText);
    console.log('[MATCH] Patient embedding generated:', patientEmbedding);

    // Generate embeddings for all caregivers and compute similarities
    const caregiversWithScores: CaregiverWithScore[] = [];
    let caregiverIndex = 0;

    for (const caregiver of caregivers) {
      console.log(`[MATCH] Processing caregiver #${caregiverIndex + 1} (id: ${caregiver.id})...`);
      const caregiverText = createCaregiverText(caregiver);
      console.log(`[MATCH] Caregiver #${caregiverIndex + 1} text:`, caregiverText);

      console.log(`[MATCH] Generating embedding for caregiver #${caregiverIndex + 1}...`);
      const caregiverEmbedding = await generateEmbedding(caregiverText);
      console.log(`[MATCH] Caregiver #${caregiverIndex + 1} embedding:`, caregiverEmbedding);

      // Compute semantic similarity
      console.log(`[MATCH] Computing semantic similarity for caregiver #${caregiverIndex + 1}...`);
      const semanticScore = cosineSimilarity(patientEmbedding, caregiverEmbedding);
      console.log(`[MATCH] Caregiver #${caregiverIndex + 1} semantic score:`, semanticScore);

      // Compute location similarity
      console.log(`[MATCH] Computing location similarity for caregiver #${caregiverIndex + 1}...`);
      const locationScore = computeLocationSimilarity(
        patient.user?.location,
        caregiver.user?.location
      );
      console.log(`[MATCH] Caregiver #${caregiverIndex + 1} location score:`, locationScore);

      // Combine scores (70% semantic, 30% location)
      const finalScore = (semanticScore * 0.7) + (locationScore * 0.3);
      console.log(`[MATCH] Caregiver #${caregiverIndex + 1} final score:`, finalScore);

      // Only include caregivers with a score >= minScore
      if (finalScore >= minScore) {
        caregiversWithScores.push({
          ...caregiver,
          score: finalScore
        });
      } else {
        console.log(`[MATCH] Caregiver #${caregiverIndex + 1} - ${caregiver.user.fullname} filtered out (score below minScore: ${minScore})`);
      }

      caregiverIndex++;
    }

    // Sort by score (highest first)
    console.log('[MATCH] Sorting caregivers by score...');
    const sorted = caregiversWithScores.sort((a, b) => b.score - a.score);
    console.log('[MATCH] Caregiver matching process complete. Returning sorted matches.');
    return sorted;

  } catch (error) {
    console.error('Error in caregiver matching:', error);
    throw new Error('Failed to match caregivers');
  }
}
