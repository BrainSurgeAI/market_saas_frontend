"use client"
import Lottie from "lottie-react"
import animationData from "@/app/assets/lottie/truck.json"

export default function Loading() {
	return (
		<div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
			<div className="relative flex items-center space-x-4">
				<div className="h-32 w-32">
					<Lottie
						animationData={animationData}
						loop={true}
						autoplay={true}
						rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
					/>
				</div>
				<div className="flex flex-col">
					<h3 className="text-base font-semibold text-gray-900">Waiting...</h3>
					<p className="text-sm text-gray-600">Loading more data...</p>
				</div>
			</div>
		</div>
	)
}