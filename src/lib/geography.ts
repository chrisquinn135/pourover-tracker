import type { Region } from './types';

/** Country → continent region used for nested geography scoring. */
const COUNTRY_REGION: Record<string, Region> = {
	ethiopia: 'africa',
	kenya: 'africa',
	rwanda: 'africa',
	burundi: 'africa',
	uganda: 'africa',
	tanzania: 'africa',
	malawi: 'africa',
	zambia: 'africa',
	congo: 'africa',
	'democratic republic of the congo': 'africa',
	cameroon: 'africa',
	yemen: 'asia',
	indonesia: 'asia',
	sumatra: 'asia',
	java: 'asia',
	sulawesi: 'asia',
	'papua new guinea': 'asia',
	india: 'asia',
	china: 'asia',
	thailand: 'asia',
	vietnam: 'asia',
	laos: 'asia',
	myanmar: 'asia',
	nepal: 'asia',
	philippines: 'asia',
	taiwan: 'asia',
	japan: 'asia',
	colombia: 'america',
	brazil: 'america',
	peru: 'america',
	guatemala: 'america',
	'costa rica': 'america',
	panama: 'america',
	honduras: 'america',
	nicaragua: 'america',
	'el salvador': 'america',
	mexico: 'america',
	ecuador: 'america',
	bolivia: 'america',
	jamaica: 'america',
	haiti: 'america',
	'dominican republic': 'america',
	cuba: 'america',
	hawaii: 'america',
	'united states': 'america',
	usa: 'america',
	italy: 'europe',
	portugal: 'europe',
	spain: 'europe'
};

export function normalizeCountry(country: string): string {
	return country.trim().toLowerCase();
}

export function regionFromCountry(country: string): Region | '' {
	const key = normalizeCountry(country);
	return COUNTRY_REGION[key] ?? '';
}

export function resolveRegion(country: string, region: string): Region | '' {
	const explicit = region.trim().toLowerCase() as Region | '';
	if (explicit === 'asia' || explicit === 'europe' || explicit === 'america' || explicit === 'africa') {
		return explicit;
	}
	return regionFromCountry(country);
}
