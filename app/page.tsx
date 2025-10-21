import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { PriceAnnouncements } from "@/components/homepage/PriceAnnouncements"
import { Category } from './workspace/types'
import { getCategories, getAnnouncementPrices } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export default async function Page() {
	const currentDate = format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
	const [products, categories] = await Promise.all([
		getAnnouncementPrices(),
		getCategories()
	]);

	const isNotPublished = products.length === 0;
	const categoriesMap = new Map(categories.map((category: Category) => [category.id, category.level_one_category]))

	const priceStats = {
		total: products.length,
		increased: products.filter((p) => parseFloat(p.avgPriceChange) > 0).length,
		decreased: products.filter((p) => parseFloat(p.avgPriceChange) < 0).length,
		unchanged: products.filter((p) => parseFloat(p.avgPriceChange) === 0).length,
	}

	return (
		<PriceAnnouncements
			initialProducts={products}
			currentDate={currentDate}
			isPriceNotPublished={isNotPublished}
			categories={categoriesMap}
			priceStats={priceStats}
		/>
	)

}
