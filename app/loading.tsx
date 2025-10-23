"use client"
import { useState, useEffect } from "react"

export default function Loading() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	const LottieComponent = isClient ? require("lottie-react").default : null
	const animationData = isClient ? require("@/app/assets/lottie/truck.json") : null

	return (
		<div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
			<div className="relative flex items-center space-x-4">
				<div className="h-32 w-32">
					{isClient && LottieComponent && animationData ? (
						<LottieComponent
							animationData={animationData}
							loop={true}
							autoplay={true}
							rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
						/>
					) : (
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
					)}
				</div>
				<div className="flex flex-col">
					<h3 className="text-base font-semibold text-gray-900">Waiting...</h3>
					<p className="text-sm text-gray-600">Loading more data...</p>
				</div>
			</div>
		</div>
	)
}