'use client';

import { useState, useEffect } from 'react';
import { VehicleCard } from '@/components/VehicleCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import Link from 'next/link';

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

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    yearMin: '',
    yearMax: '',
    priceMax: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.make) queryParams.append('make', filters.make);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.yearMin) queryParams.append('yearMin', filters.yearMin);
      if (filters.yearMax) queryParams.append('yearMax', filters.yearMax);
      if (filters.priceMax) queryParams.append('priceMax', filters.priceMax);
      
      const response = await fetch(`/api/vehicles?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const popularMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Lexus'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <Input
                  placeholder="Make (e.g., Toyota)"
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                />
                <Input
                  placeholder="Model (e.g., Camry)"
                  value={filters.model}
                  onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Min Year"
                  value={filters.yearMin}
                  onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max Year"
                  value={filters.yearMax}
                  onChange={(e) => setFilters({ ...filters, yearMax: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max Price ($)"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 mr-2">Popular:</span>
                  {popularMakes.map((make) => (
                    <button
                      key={make}
                      type="button"
                      onClick={() => {
                        setFilters({ ...filters, make });
                        fetchVehicles();
                      }}
                      className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      {make}
                    </button>
                  ))}
                </div>
                
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">No vehicles found</p>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Found {vehicles.length} vehicles
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

