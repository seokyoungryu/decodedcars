// Hand-written buying advice per "best by class" list (src/pages/best/[slug].astro): what matters in each class
// beyond the four scored measures, and what to check before buying.
export interface ClassTip {
  intro: string;
  check: string[];
  guide?: { href: string; label: string };
}

export const CLASS_TIPS: Record<string, ClassTip> = {
  'small-suvs': {
    intro: `Small SUVs are the most popular kind of new car in America because they do many jobs reasonably well: a raised seating position, a hatch that swallows a stroller or a week of groceries, and fuel economy close to a midsize sedan. The trade-off is that they are built on car platforms, so "SUV" says little about off-road ability, and the differences between rivals are often small. That is where the details matter — how much the hybrid version saves, whether all-wheel drive is standard or optional, and how a particular model year has held up.`,
    check: ['Rear-seat legroom and how easily a rear-facing child seat fits', 'Cargo space with the rear seats up, not just folded', 'Whether all-wheel drive costs extra, and what it does to MPG', 'The hybrid version: it often pays back its price within a few years of average driving'],
    guide: { href: '/guide/awd-vs-4wd', label: 'AWD vs 4WD explained' },
  },
  'midsize-and-large-suvs': {
    intro: `Midsize and large SUVs are bought for space: a third row, room for five adults, or towing a small boat or camper. Size raises fuel costs quickly, so the efficiency score separates these models more than in any other class — a hybrid three-row SUV can cost far less per year to fuel than a V8 one of similar size. Body-on-frame models tow more and handle rough roads better; unibody models ride and handle more like cars.`,
    check: ['Third-row access and headroom with adults, not just children', 'Cargo space behind the third row with all seats up', 'Towing rating of the exact engine and drivetrain you are considering', 'LATCH anchor positions if you will fit more than two child seats'],
    guide: { href: '/guide/three-row-family-suv', label: 'Choosing a three-row SUV or minivan' },
  },
  'luxury-small-suvs': {
    intro: `Luxury small SUVs trade some cargo space for nicer materials, quieter cabins and stronger engines. Many require premium fuel, which is already reflected in our fuel-cost figure, and many bundle advanced driver aids that mainstream brands charge extra for. Because these models are often leased and returned after three years, they are also common on the used market — where a well-kept example can cost much less than a new mainstream SUV.`,
    check: ['Whether premium fuel is required or only recommended', 'Which driver aids are standard versus part of an option package', 'Maintenance cost after the free scheduled-maintenance period ends', 'For used models: the remaining factory or certified pre-owned warranty'],
  },
  'luxury-large-suvs': {
    intro: `Large luxury SUVs combine the space of a family SUV with the comfort and power of a luxury sedan. They are heavy, so fuel costs are high and the spread between models is wide — plug-in hybrid and electric versions change the math considerably if you can charge at home. Complex features such as air suspension, large screens and power-operated everything add to repair risk once the warranty ends, so recall and complaint history deserve a close look.`,
    check: ['Air suspension and electronics coverage after the warranty expires', 'Real third-row usability — some are best for occasional use only', 'Tire size and replacement cost on large wheels', 'Plug-in versions: electric-only range against your daily driving'],
  },
  'pickup-trucks': {
    intro: `Pickup trucks range from compact models that drive like a crossover to heavy-duty trucks built for large trailers. Most buyers need less truck than they think: the right choice depends on what you really tow or haul, how often, and how much parking space you have. Hybrid powertrains have arrived in several trucks and can cut fuel costs noticeably for drivers who mostly commute in them.`,
    check: ['Payload and towing ratings for the exact cab, bed and engine combination', 'Whether you need 4WD or whether 2WD with good tires would do', 'Bed length versus cab size — a longer bed often means a smaller rear seat', 'Overall length against your garage or parking space'],
    guide: { href: '/guide/awd-vs-4wd', label: 'AWD vs 4WD explained' },
  },
  minivans: {
    intro: `Minivans remain the most practical family vehicles you can buy. Sliding doors make loading children easy in tight parking spaces, the third row is usually adult-sized, and the floor is low. Only a few models remain on sale, so each one matters, and hybrid versions now offer fuel economy that no three-row SUV with a gas engine can match.`,
    check: ['Second-row seats: removable, stowable or fixed captain\'s chairs', 'Whether all-wheel drive is available on the version you want', 'Power sliding doors and their recall history', 'Cargo well depth behind the third row'],
    guide: { href: '/guide/three-row-family-suv', label: 'Minivan or three-row SUV?' },
  },
  'small-cars': {
    intro: `Small cars are the most affordable way to buy a new car and among the cheapest to run. Fewer small models are sold each year as buyers move to SUVs, which also means good used examples can be inexpensive. The main compromises are rear-seat space and road noise; crash ratings vary more in this class than in larger ones, so the safety score is worth checking closely.`,
    check: ['Rear-seat space if you regularly carry adults', 'Highway noise and comfort on a longer test drive', 'Standard automatic emergency braking — not every trim includes it', 'Sedan versus hatchback: hatchbacks are often far more practical'],
    guide: { href: '/guide/first-car-checklist', label: 'Buying your first car' },
  },
  'midsize-cars': {
    intro: `Midsize sedans offer more rear-seat room than many SUVs, better fuel economy and often lower prices. Several are now available only as hybrids or have a hybrid version that costs little more, which is reflected in our fuel-cost scores. Their lower ride height means easier handling and less weight, but a bit more effort getting in and out.`,
    check: ['Hybrid versus gas version price difference and payback', 'Trunk opening size, not just trunk volume', 'Whether all-wheel drive is offered if you face snowy winters', 'Rear headroom under sloping rooflines'],
  },
  'luxury-cars': {
    intro: `Luxury cars span compact sport sedans to large flagships. They offer the latest technology first, which is both their appeal and a source of early-model-year problems: new infotainment and driver-assistance systems are frequent subjects of complaints and software recalls. Depreciation is steep, so a two- or three-year-old example often represents better value than a new one.`,
    check: ['Complaint history for the infotainment and driver-assist systems', 'Run-flat tires and their replacement cost', 'Premium fuel requirement', 'Certified pre-owned warranty terms if buying used'],
  },
  'sports-cars': {
    intro: `Sports cars are bought with the heart, but a few facts still help. Insurance can be much higher than for a sedan of the same price, tires wear faster and cost more, and rear-wheel-drive models need winter tires in snowy climates. Many sports cars are driven fewer miles than average, so low-mileage used examples are common — but they should still be inspected for track or hard use.`,
    check: ['Insurance quote before you buy', 'Tire size and the cost of a full set', 'Winter usability: rear-wheel drive, ground clearance and tire choice', 'Signs of track use on a used car: worn brakes, aftermarket parts, missing service records'],
  },
  wagons: {
    intro: `Wagons and hatchbacks give you most of the cargo space of a small SUV with the handling and fuel economy of a car. Few are sold in the U.S., so the choice is narrow, but those that remain are often well equipped and sometimes offered with all-wheel drive. They are a good alternative if you want practicality without the height and weight of an SUV.`,
    check: ['Cargo floor length with the rear seats folded', 'Ground clearance if you drive unpaved roads', 'Roof rack options for bikes or boxes', 'Rear visibility through the tailgate window'],
    guide: { href: '/guide/suv-vs-sedan-size', label: 'SUV vs sedan vs hatchback' },
  },
  'electric-suvs': {
    intro: `Electric SUVs are the fastest-growing part of the market. Our fuel-cost figure uses EPA efficiency and average electricity prices, so efficient models score well even if their range is shorter. Range, charging speed and charging network access matter as much as the score for road trips, and cold weather reduces range noticeably. If you can charge at home, daily running costs are typically far below a gas SUV.`,
    check: ['EPA range against your longest regular trip, with a margin for winter', 'DC fast-charging speed and which charging networks it can use', 'Home charging: whether you can install a Level 2 charger', 'Battery warranty terms and any battery-related recalls'],
    guide: { href: '/guide/hybrid-ev-or-gas', label: 'Hybrid, EV or gas?' },
  },
  'electric-cars': {
    intro: `Electric cars are lighter and more aerodynamic than electric SUVs, so they usually go farther on the same battery. The class ranges from affordable compacts to long-range luxury sedans. Software matters more in EVs than in any other car — many fixes arrive as over-the-air updates — so check how a model's recalls were handled, not just how many there were.`,
    check: ['Range and charging speed for your driving', 'Whether recalls were fixed over the air or required a dealer visit', 'Rear-seat headroom under low rooflines', 'For used EVs: battery health report and remaining battery warranty'],
    guide: { href: '/guide/used-ev-battery', label: 'Checking a used EV battery' },
  },
  'hybrid-suvs': {
    intro: `Hybrid SUVs pair a gas engine with an electric motor and a small battery, raising city fuel economy the most — exactly where SUVs usually do worst. Plug-in hybrids add a larger battery for a stretch of electric-only driving. We include a model here only if a plug-in version exists or the hybrid reaches at least 35 MPG combined, so mild hybrids with small gains don't qualify.`,
    check: ['How long the hybrid version takes to pay back its extra price at your mileage', 'Plug-in hybrids: electric range and whether you can charge daily', 'Hybrid battery warranty length on the version you choose', 'Cargo space — batteries sometimes take some of it'],
    guide: { href: '/guide/hybrid-ev-or-gas', label: 'Hybrid, EV or gas?' },
  },
  'hybrid-cars': {
    intro: `Hybrid cars are the most fuel-efficient vehicles you can buy without plugging in, and many now cost little more than their gas counterparts. Hybrid systems have proven durable in long-term use, and their brakes often last longer because regenerative braking does much of the work. Plug-in hybrid sedans add electric-only range for short commutes.`,
    check: ['Real price difference between hybrid and gas versions', 'Hybrid battery warranty and, for used cars, its remaining term', 'Trunk space compared with the gas version', 'Plug-in versions: whether you can charge where you park'],
    guide: { href: '/guide/hybrid-ev-or-gas', label: 'Hybrid, EV or gas?' },
  },
};
