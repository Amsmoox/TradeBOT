import { BarChart3, Settings, Eye, Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

// Mock economic events data - ready for backend integration
const mockEvents = [
	{
		id: 1,
		title: "Non-Farm Payrolls",
		time: "2024-01-15T08:30:00Z",
		impact: "HIGH",
		currency: "USD",
		expected: "180K",
		previous: "199K",
		actual: "216K",
		source: "Trading Economics",
		category: "Employment",
	},
	{
		id: 2,
		title: "CPI (Core) m/m",
		time: "2024-01-15T13:30:00Z",
		impact: "HIGH",
		currency: "USD",
		expected: "0.3%",
		previous: "0.2%",
		actual: "--",
		source: "Trading Economics",
		category: "Inflation",
	},
	{
		id: 3,
		title: "Unemployment Rate",
		time: "2024-01-15T15:00:00Z",
		impact: "MEDIUM",
		currency: "EUR",
		expected: "6.5%",
		previous: "6.4%",
		actual: "--",
		source: "Forex Factory",
		category: "Employment",
	},
];

export function EconomicCalendar() {
	const { getActiveInputSources, getActiveOutputDestinations } = useSettings();
	const [selectedCurrency, setSelectedCurrency] = useState("ALL");
	const [selectedImpact, setSelectedImpact] = useState("ALL");

	// Get active economic calendar sources from settings
	const activeSources = getActiveInputSources("Economic Calendar");
	const activeOutputs = getActiveOutputDestinations();

	// Check if we have active sources
	const hasActiveSources = activeSources.length > 0;

	// Filter events based on selected criteria
	const filteredEvents = mockEvents.filter((event) => {
		const currencyMatch =
			selectedCurrency === "ALL" || event.currency === selectedCurrency;
		const impactMatch = selectedImpact === "ALL" || event.impact === selectedImpact;
		return currencyMatch && impactMatch;
	});

	const getImpactColor = (impact: string) => {
		switch (impact?.toUpperCase()) {
			case "HIGH":
				return "!bg-red-600 !text-white !border-red-700 !border-2 shadow-md";
			case "MEDIUM":
				return "!bg-orange-600 !text-white !border-orange-700 !border-2 shadow-md";
			case "LOW":
				return "!bg-yellow-600 !text-white !border-yellow-700 !border-2 shadow-md";
			default:
				return "!bg-gray-600 !text-white !border-gray-700 !border-2 shadow-md";
		}
	};

	const formatTime = (time: string) => {
		return new Date(time).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short",
		});
	};

	const getCurrencyFlag = (currency: string) => {
		const flags = {
			USD: "🇺🇸",
			EUR: "🇪🇺",
			GBP: "🇬🇧",
			JPY: "🇯🇵",
			CAD: "🇨🇦",
			AUD: "🇦🇺",
		};
		return flags[currency as keyof typeof flags] || "🏳️";
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-slate-200">
			<div className="p-6 border-b border-slate-200">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
							<Calendar className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-slate-900">
								Economic Calendar
							</h3>
							<p className="text-sm text-slate-600">
								Auto-filtered high-impact events
							</p>
						</div>
					</div>
					<Button variant="ghost" size="sm">
						<Settings className="w-4 h-4 mr-2" />
						Configure Sources
					</Button>
				</div>

				{/* Filter Controls */}
				<div className="mt-4 flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<Filter className="w-4 h-4 text-slate-500" />
						<span className="text-sm text-slate-600">Filters:</span>
					</div>
					<Select
						value={selectedCurrency}
						onValueChange={setSelectedCurrency}
					>
						<SelectTrigger className="w-24">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All</SelectItem>
							<SelectItem value="USD">USD</SelectItem>
							<SelectItem value="EUR">EUR</SelectItem>
							<SelectItem value="GBP">GBP</SelectItem>
							<SelectItem value="JPY">JPY</SelectItem>
						</SelectContent>
					</Select>
					<Select value={selectedImpact} onValueChange={setSelectedImpact}>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All Impact</SelectItem>
							<SelectItem value="HIGH">High</SelectItem>
							<SelectItem value="MEDIUM">Medium</SelectItem>
							<SelectItem value="LOW">Low</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="p-6">
				{filteredEvents.length > 0 ? (
					<div className="space-y-4">
						{filteredEvents.slice(0, 3).map((event) => (
							<div
								key={event.id}
								className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
							>
								<div className="flex-1">
									<div className="flex items-center space-x-3 mb-2">
										<span className="text-lg">
											{getCurrencyFlag(event.currency)}
										</span>
										<Badge className={getImpactColor(event.impact)}>
											{event.impact}
										</Badge>
										<span className="font-medium text-slate-900">
											{event.title}
										</span>
										<span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
											{event.category}
										</span>
									</div>
									<div className="grid grid-cols-3 gap-4 text-sm">
										<div>
											<span className="text-slate-500">Expected:</span>
											<span className="ml-1 font-medium text-slate-900">
												{event.expected}
											</span>
										</div>
										<div>
											<span className="text-slate-500">Previous:</span>
											<span className="ml-1 font-medium text-slate-900">
												{event.previous}
											</span>
										</div>
										<div>
											<span className="text-slate-500">Actual:</span>
											<span
												className={`ml-1 font-medium ${
													event.actual === "--"
														? "text-slate-400"
														: "text-blue-600"
												}`}
											>
												{event.actual}
											</span>
										</div>
									</div>
									<div className="mt-2 text-xs text-slate-500">
										Source: {event.source}
									</div>
								</div>
								<div className="text-right ml-4">
									<p className="text-sm font-medium text-slate-900">
										{formatTime(event.time)}
									</p>
									<p className="text-xs text-slate-500">Today</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8">
						<BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
						<p className="text-slate-600 mb-2">
							No events match your filter criteria
						</p>
						<p className="text-sm text-slate-500">
							Adjust filters to see more events
						</p>
					</div>
				)}

				<div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
					<div className="flex items-center space-x-4 text-sm">
						<div className="flex items-center space-x-2">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-slate-600">
								Auto-posting:{" "}
								{selectedImpact === "HIGH"
									? "High impact only"
									: "All events"}
							</span>
						</div>
						<span className="text-slate-500">•</span>
						<span className="text-slate-600">
							Next update:{" "}
							{new Date(Date.now() + 3600000).toLocaleTimeString()}
						</span>
					</div>
					<Button variant="ghost" size="sm">
						<Eye className="w-4 h-4 mr-2" />
						View All Events
					</Button>
				</div>
			</div>
		</div>
	);
}
