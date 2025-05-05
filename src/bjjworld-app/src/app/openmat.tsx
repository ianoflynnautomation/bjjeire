import { useState, useCallback, useMemo } from 'react'
import { useGyms } from '../features/gyms/api/get-gyms'
import { GymDto } from '../types/gyms'
import SearchForm from '../components/ui/search-form/search-form'
import ErrorMessage from '../components/ui/error-message/error-message'
import LoadingSpinner from '../components/ui/loading-spinner/loading-spinner'
import NoResults from '../components/ui/no-result/no-result'
import Pagination from '../components/ui/pagination/pagination'
import GymList from '../features/gyms/components/gym/gym-list'
import { CITIES } from '../constants/cities'

const PAGE_SIZE = 12 // Define page size matching API default or request

function OpenMatFinder() {
  // State for the currently selected city and pagination
  const [searchCity, setSearchCity] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const {
    data: gymsResponse,
    isLoading,
    isFetching,
    error,
    isSuccess,
  } = useGyms({
    city: searchCity,
    page: currentPage,
    pageSize: PAGE_SIZE,
    queryConfig: {
      enabled: !!searchCity,
    },
  })

  const handleSearch = useCallback((city: string) => {
    setSearchCity(city)
    setCurrentPage(1) // Reset to the first page on a new search
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const gymData: GymDto[] = gymsResponse?.data ?? []
  const paginationData = gymsResponse?.pagination

  const renderContent = useMemo(() => {
    if (!searchCity) {
      return (
        <p className="text-center text-gray-500 mt-8">Please select a city to find open mats.</p>
      )
    }

    if (isLoading || isFetching) {
      return <LoadingSpinner />
    }

    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch gym data.'
      return <ErrorMessage message={errorMessage} />
    }

    if (isSuccess && gymData.length === 0) {
      return <NoResults city={searchCity} />
    }

    return <GymList gyms={gymData} />
  }, [searchCity, isLoading, isFetching, error, gymData, isSuccess])

  const canPaginate = isSuccess && !!paginationData && paginationData.totalPages > 1

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Page Header */}
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Find BJJ Open Mats Near You
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Select a city to discover Brazilian Jiu-Jitsu gyms.
          </p>
        </header>

        {/* Search Area */}
        <section aria-labelledby="search-heading" className="mb-8 md:mb-10">
          <h2 id="search-heading" className="sr-only">
            Search Controls
          </h2>
          <SearchForm
            cities={CITIES}
            onSearch={handleSearch}
            // Disable form slightly differently: maybe only during the very initial load?
            // Or keep disabled during any fetch triggered by searchCity change.
            isLoading={isLoading || (isFetching && !!searchCity)}
          />
        </section>

        {/* Results Area */}
        <main aria-live="polite">{renderContent}</main>

        {/* --- Pagination Area --- */}
        {/* Render pagination controls only if needed and data is successfully loaded */}
        {canPaginate && paginationData && (
          <nav aria-label="Gym results pagination" className="mt-8 md:mt-10 flex justify-center">
            <Pagination
              currentPage={currentPage} // Current page from state
              totalPages={paginationData.totalPages} // Total pages from API response
              onPageChange={handlePageChange} // Callback to update state
              // Optional: pass hasNextPage/hasPreviousPage if your component uses them
              // hasNextPage={paginationData.hasNextPage}
              // hasPreviousPage={paginationData.hasPreviousPage}
            />
          </nav>
        )}
      </div>
    </div>
  )
}

export default OpenMatFinder
