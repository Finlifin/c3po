import axios from 'axios'

// OSS服务的基础URL，可以从环境变量配置
const OSS_BASE_URL = import.meta.env.VITE_OSS_BASE_URL || 'http://10.70.141.134:5000'

export const ossApi = {
    /**
     * 上传图片到OSS
     * @param file 图片文件
     * @returns Promise with response containing url
     */
    uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
        const formData = new FormData()
        formData.append('file', file)

        return axios.post(`${OSS_BASE_URL}/api/v1/images/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => {
            return response.data
        }).catch(error => {
            return {
                success: false,
                error: error.response?.data?.error || '上传失败'
            }
        })
    },

    /**
     * 获取图片访问URL
     * @param filename 文件名（从uploadImage返回的url）
     * @returns 完整的图片访问URL
     */
    getImageUrl(filename: string): string {
        return `${OSS_BASE_URL}/api/v1/images/${filename}`
    }
}
