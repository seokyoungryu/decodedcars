// EPA classes are by size only; compare mainstream with mainstream and luxury with luxury first
export const LUXURY = new Set(['ACURA', 'ALFAROMEO', 'ASTONMARTIN', 'AUDI', 'BENTLEY', 'BMW', 'BMWALPINA', 'BUGATTI', 'CADILLAC', 'FERRARI', 'GENESIS', 'INFINITI', 'JAGUAR', 'LAMBORGHINI', 'LANDROVER', 'LEXUS', 'LINCOLN', 'LOTUS', 'LUCID', 'MASERATI', 'MCLARENAUTOMOTIVE', 'MERCEDESBENZ', 'POLESTAR', 'PORSCHE', 'ROLLSROYCE', 'ROLLSROYCEMOTORCARSLTD', 'TESLA', 'VOLVO']);
export const EXOTIC = new Set(['ASTONMARTIN', 'BENTLEY', 'BUGATTI', 'FERRARI', 'LAMBORGHINI', 'LOTUS', 'MCLARENAUTOMOTIVE', 'ROLLSROYCE', 'ROLLSROYCEMOTORCARSLTD']);
export const tier = (key) => (EXOTIC.has(key.split('|')[0]) ? 2 : LUXURY.has(key.split('|')[0]) ? 1 : 0);
