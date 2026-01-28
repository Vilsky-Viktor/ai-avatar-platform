import Header from '../components/Header'

function UserLayer() {
    return (
        <div className="min-h-screen flex flex-col bg-base-200 w-full transition-colors duration-300">
            <Header/>
            <main className="flex-grow p-6">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="card bg-base-100 shadow-lg border border-base-300">
                        <div className="card-body">
                        <h2 className="card-title text-2xl">Main Content Area</h2>
                        <p className="text-base-content/70">
                            Test
                        </p>
                        
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default UserLayer;