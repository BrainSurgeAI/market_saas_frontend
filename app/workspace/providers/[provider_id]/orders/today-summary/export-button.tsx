"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";

// 导入AggregatedItem类型
interface ProcessingRequirement {
  requirement: string;
  quantity: number;
  remark?: string;
}

interface Customer {
  customerName: string;
  quantity: number;
  processingRequirements: ProcessingRequirement[];
}

interface AggregatedItem {
  productName: string;
  productId: string;
  unit: string;
  totalQuantity: number;
  customers: Customer[];
}

export function ExportButton({ data }: { data: AggregatedItem[] }) {
  const handleExport = async () => {
    if (data.length === 0) return;
    
    try {
      // 动态导入所需库
      const ExcelJS = (await import('exceljs')).default;
      const FileSaver = (await import('file-saver')).default;
      
      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('今日订单汇总');
      
      // 设置表头 - 添加一列用于显示重量
      worksheet.columns = [
        { header: '产品名称', key: 'productName', width: 25 },
        { header: '总数量', key: 'totalQuantity', width: 10 },
        { header: '单位', key: 'unit', width: 8 },
        { header: '客户与处理要求', key: 'details', width: 60 },
        { header: '', key: 'quantity', width: 10 } // 添加一列用于显示重量
      ];
      
      // 设置表头样式
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9ECEF' } // 浅灰色背景
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // 为表头添加边框
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // 添加数据行
      let rowIndex = 2;
      
      data.forEach((product, productIndex) => {
        // 添加产品行，并设置样式
        const productRow = worksheet.addRow({
          productName: product.productName,
          totalQuantity: product.totalQuantity,
          unit: product.unit,
          details: '',
          quantity: ''
        });
        
        productRow.font = { bold: true };
        productRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // 为产品行添加边框
        productRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        if (productIndex % 2 === 0) {
          productRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // 白色背景
          };
        } else {
          productRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // 浅灰色背景
          };
        }
        
        // 记录产品行号，用于后续合并单元格
        const productRowNumber = rowIndex;
        rowIndex++;
        
        // 记录该产品下所有行的数量，用于后续合并单元格
        let totalRowsForProduct = 0;
        
        // 处理每个客户
        product.customers.forEach((customer, customerIndex) => {
          // 添加客户行
          const customerRow = worksheet.addRow({
            productName: '',
            totalQuantity: '',
            unit: '',
            details: customer.customerName,
            quantity: ''
          });
          
          customerRow.font = { bold: true };
          customerRow.getCell('details').alignment = { vertical: 'middle', horizontal: 'left' };
          
          // 为客户行添加边框
          customerRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          
          rowIndex++;
          totalRowsForProduct++;
          
          // 处理每个处理要求
          customer.processingRequirements.forEach(req => {
            const requirementText = req.requirement || '无特殊要求';
            let bulletText = `• ${requirementText}`;
            
            if (req.remark) {
              bulletText += ` (${req.remark})`;
            }
            
            // 添加处理要求行
            const reqRow = worksheet.addRow({
              productName: '',
              totalQuantity: '',
              unit: '',
              details: bulletText,
              quantity: `${req.quantity} ${product.unit}`
            });
            
            reqRow.getCell('details').alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
            reqRow.getCell('details').font = { color: { argb: 'FF666666' } };
            
            // 设置重量单元格样式
            reqRow.getCell('quantity').alignment = { vertical: 'middle', horizontal: 'right' };
            reqRow.getCell('quantity').font = { color: { argb: 'FF666666' } };
            
            // 为处理要求行添加边框
            reqRow.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
            
            rowIndex++;
            totalRowsForProduct++;
          });
          
          // 如果不是最后一个客户，添加分隔行
          if (customerIndex < product.customers.length - 1) {
            const separatorRow = worksheet.addRow({
              productName: '',
              totalQuantity: '',
              unit: '',
              details: '',
              quantity: ''
            });
            
            // 为分隔行添加边框
            separatorRow.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
            
            separatorRow.getCell('details').border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'dashed', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin' }
            };
            
            rowIndex++;
            totalRowsForProduct++;
          }
        });
        
        // 合并产品单元格
        if (totalRowsForProduct > 0) {
          worksheet.mergeCells(productRowNumber, 1, productRowNumber + totalRowsForProduct, 1); // 产品名称
          worksheet.mergeCells(productRowNumber, 2, productRowNumber + totalRowsForProduct, 2); // 总数量
          worksheet.mergeCells(productRowNumber, 3, productRowNumber + totalRowsForProduct, 3); // 单位
          
          // 设置合并后单元格的边框
          const mergedCells = [
            worksheet.getCell(productRowNumber, 1),
            worksheet.getCell(productRowNumber, 2),
            worksheet.getCell(productRowNumber, 3)
          ];
          
          mergedCells.forEach(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });
      
      // 导出Excel文件
      const today = format(new Date(), 'yyyy-MM-dd');
      const buffer = await workbook.xlsx.writeBuffer();
      FileSaver.saveAs(new Blob([buffer]), `今日订单汇总-${today}.xlsx`);
    } catch (error) {
      console.error('导出Excel失败:', error);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={data.length === 0}
      className="ml-auto flex items-center gap-1"
    >
      <Download size={16} />
      <span>导出Excel</span>
    </Button>
  );
} 