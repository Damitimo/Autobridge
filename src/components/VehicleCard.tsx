import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin: string;
  currentBid?: string | null;
  condition?: string | null;
  titleStatus?: string | null;
  odometer?: number | null;
  primaryDamage?: string | null;
  auctionDate?: Date | string | null;
  auctionLocation?: string | null;
  thumbnailUrl?: string | null;
  images?: string[] | null;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const imageUrl = vehicle.thumbnailUrl || vehicle.images?.[0] || '/placeholder-car.jpg';
  const currentBid = vehicle.currentBid ? parseFloat(vehicle.currentBid) : 0;
  
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        <div className="relative h-48 bg-gray-200">
          <img
            src={imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-car.jpg';
            }}
          />
          {vehicle.titleStatus && (
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium">
              {vehicle.titleStatus.toUpperCase()}
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          
          {vehicle.trim && (
            <p className="text-sm text-gray-600 mb-2">{vehicle.trim}</p>
          )}
          
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>VIN:</span>
              <span className="font-mono">{vehicle.vin.substring(vehicle.vin.length - 6)}</span>
            </div>
            
            {vehicle.odometer && (
              <div className="flex justify-between">
                <span>Mileage:</span>
                <span>{vehicle.odometer.toLocaleString()} miles</span>
              </div>
            )}
            
            {vehicle.primaryDamage && (
              <div className="flex justify-between">
                <span>Damage:</span>
                <span className="text-red-600">{vehicle.primaryDamage}</span>
              </div>
            )}
            
            {vehicle.condition && (
              <div className="flex justify-between">
                <span>Condition:</span>
                <span className="capitalize">{vehicle.condition.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-600">Current Bid</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(currentBid, 'USD')}
            </p>
          </div>
          
          {vehicle.auctionDate && (
            <div className="text-right">
              <p className="text-xs text-gray-600">Auction Date</p>
              <p className="text-sm font-medium">
                {formatDate(vehicle.auctionDate, 'short')}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

