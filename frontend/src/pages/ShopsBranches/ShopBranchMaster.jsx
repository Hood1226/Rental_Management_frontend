import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import PageContainer from '../../components/common/PageContainer'
import { shopService } from '../../services/shopService'

function ShopBranchMaster() {
  const queryClient = useQueryClient()
  const [shopPayload, setShopPayload] = useState({ shopName: '', shopCode: '' })
  const [branchPayload, setBranchPayload] = useState({ shopId: '', branchName: '', branchCode: '' })

  const { data: shopsData } = useQuery({
    queryKey: ['shops'],
    queryFn: () => shopService.getShops(),
  })

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => shopService.getBranches(),
  })

  const createShopMutation = useMutation({
    mutationFn: (payload) => shopService.createShop(payload),
    onSuccess: () => {
      toast.success('Shop created successfully')
      setShopPayload({ shopName: '', shopCode: '' })
      queryClient.invalidateQueries({ queryKey: ['shops'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create shop'),
  })

  const createBranchMutation = useMutation({
    mutationFn: (payload) => shopService.createBranch(payload),
    onSuccess: () => {
      toast.success('Branch created successfully')
      setBranchPayload({ shopId: '', branchName: '', branchCode: '' })
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create branch'),
  })

  const shops = shopsData?.data || []
  const branches = branchesData?.data || []

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Shop Master</h3>
          <div className="space-y-2">
            <input
              value={shopPayload.shopName}
              onChange={(e) => setShopPayload((p) => ({ ...p, shopName: e.target.value }))}
              placeholder="Shop name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={shopPayload.shopCode}
              onChange={(e) => setShopPayload((p) => ({ ...p, shopCode: e.target.value }))}
              placeholder="Shop code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => createShopMutation.mutate(shopPayload)}
              className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm"
            >
              Create Shop
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {shops.map((shop) => (
              <div key={shop.shopId} className="text-sm text-gray-700 border rounded px-2 py-1">
                {shop.shopName} ({shop.shopCode})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Branch Master</h3>
          <div className="space-y-2">
            <select
              value={branchPayload.shopId}
              onChange={(e) => setBranchPayload((p) => ({ ...p, shopId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select shop</option>
              {shops.map((shop) => (
                <option key={shop.shopId} value={shop.shopId}>
                  {shop.shopName}
                </option>
              ))}
            </select>
            <input
              value={branchPayload.branchName}
              onChange={(e) => setBranchPayload((p) => ({ ...p, branchName: e.target.value }))}
              placeholder="Branch name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={branchPayload.branchCode}
              onChange={(e) => setBranchPayload((p) => ({ ...p, branchCode: e.target.value }))}
              placeholder="Branch code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => createBranchMutation.mutate({ ...branchPayload, shopId: Number(branchPayload.shopId) })}
              className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm"
            >
              Create Branch
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {branches.map((branch) => (
              <div key={branch.branchId} className="text-sm text-gray-700 border rounded px-2 py-1">
                {branch.shopName} - {branch.branchName} ({branch.branchCode})
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default ShopBranchMaster
