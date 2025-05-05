import { GymDto } from '../../../../types/gyms';
import GymCard from './gym-card';

import { memo } from 'react';

function GymList({ gyms }: { gyms: GymDto[] }) {
  if (!gyms.length) {
    return <div className="text-center text-gray-500 text-lg">No gyms to display</div>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 w-full p-5 bg-gray-100">
      {gyms.map((gym) => (
        <div key={gym.id} className="border-2 border-blue-500 p-5 bg-white rounded-3xl transition-shadow duration-300 hover:shadow-md">
          <GymCard
            name={gym.name}
            description={gym.description}
            openingHours={gym.openingHours}
            address={gym.address}
            coordinates={gym.coordinates}
            contact={gym.contact}
            imageUrl={gym.imageUrl}
          />
        </div>
      ))}
    </div>
  );
}
export default memo(GymList);

